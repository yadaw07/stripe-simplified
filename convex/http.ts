import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';

import type { WebhookEvent } from '@clerk/backend';

import stripe from '../lib/stripe';

import { Webhook } from 'svix';
import { api } from './_generated/api';

const http = httpRouter();

const clerkWebhook = httpAction(async (ctx, request) => {
  // verifies that the webhook is from Clerk
  console.log('INITIALIZING THE WEBHOOK...');
  const event = await validateRequest(request);

  if (!event) {
    return new Response('Error occured', { status: 400 });
  }

  // Listen for user creation event from clerk
  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      // Create a stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { clerkId: id },
      });

      // Save users to convex db
      await ctx.runMutation(api.users.createUser, {
        clerkId: id,
        email,
        name,
        stripeCustomerId: customer.id,
      });
    } catch (err: any) {
      console.error(err.message || 'Users creation failed in convex');
      return new Response('Error creating users', { status: 500 });
    }

    return new Response('Webhook processed successfully', { status: 200 });
  }

  // Listen for user update event
  if (event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = event.data;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      // Update user in Convex
      await ctx.runMutation(api.users.updateUser, {
        clerkId: id,
        email,
        name,
      });

      console.log(`User ${id} updated successfully`);
    } catch (err: any) {
      console.error(err.message || 'Users update failed in convex');
      return new Response('Error updating users', { status: 500 });
    }
    return new Response('User updated successfully', { status: 200 });
  }

  // Listen for user deletion event
  if (event.type === 'user.deleted') {
    const { id } = event.data;

    if (!id) {
      return new Response('No user id provided', { status: 400 });
    }

    try {
      // Get user to find stripeCustomerId
      const user = await ctx.runQuery(api.users.getUserByClerkId, {
        clerkId: id,
      });

      // Delete stripe customer
      if (user?.stripeCustomerId) {
        await stripe.customers.del(user.stripeCustomerId);
        console.log(`Stripe customer ${user.stripeCustomerId} deleted`);
      }

      // Delete user from Convex
      await ctx.runMutation(api.users.deleteUser, {
        clerkId: id,
      });

      console.log(`User ${id} deleted successfully`);
    } catch (err: any) {
      console.error(err.message || 'Users deletion failed in convex');
      return new Response('Error deleting users', { status: 500 });
    }

    return new Response('User deleted successfully', { status: 200 });
  }

  // Handle other event types (or ignore them)
  return new Response('Event type not handled', { status: 200 });
});

http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: clerkWebhook,
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
  if (!webhookSecret) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET env variable');
  }

  const svix_id = req.headers.get('svix-id');
  const svix_signature = req.headers.get('svix-signature');
  const svix_timestamp = req.headers.get('svix-timestamp');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    new Response('Error occurred -- no svix headers', { status: 400 });
    return null;
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);

  try {
    return wh.verify(body, {
      'svix-id': svix_id,
      'svix-signature': svix_signature,
      'svix-timestamp': svix_timestamp,
    }) as unknown as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook event', err);
    return null;
  }
}

export default http;
