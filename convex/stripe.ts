import { ConvexError, v } from 'convex/values';
import { action, ActionCtx } from './_generated/server';
import { api } from './_generated/api';

import stripe from '../lib/stripe';
import { checkoutRateLimit } from '../lib/ratelimit';

const isAuth = async (ctx: ActionCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError('Unauthorized');
  }

  const user = await ctx.runQuery(api.users.getUserByClerkId, {
    clerkId: identity.subject,
  });

  if (!user) {
    throw new ConvexError('User not found');
  }

  const rateLimitKey = `checkout-rate-limt:${user._id}`;
  const { success } = await checkoutRateLimit.limit(rateLimitKey);

  if (!success) {
    throw new Error(`Rate limit excceded.`);
  }

  return user;
};

// Handle one time payment
export const createCheckoutSession = action({
  args: {
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const user = await isAuth(ctx);

    const course = await ctx.runQuery(api.courses.getCourseById, {
      courseId: args.courseId,
    });

    if (!course) {
      throw new ConvexError('Course not found');
    }

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              images: [course.imageUrl],
            },
            unit_amount: Math.round(course.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${args.courseId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses`,

      metadata: {
        courseId: args.courseId,
        userId: user._id,
        courseTitle: course.title,
        courseImage: course.imageUrl,
      },
    });

    return { checkoutUrl: session.url };
  },
});

export const createProPlanCheckoutSession = action({
  args: {
    planId: v.union(v.literal('month'), v.literal('year')),
  },
  handler: async (ctx, args) => {
    try {
      const user = await isAuth(ctx);

      const priceId =
        args.planId === 'month'
          ? process.env.STRIPE_MONTHLY_PRICE_ID
          : process.env.STRIPE_YEARLY_PRICE_ID;

      if (!priceId) {
        throw new Error(
          `Missing STRIPE_${args.planId.toUpperCase()}_PRICE_ID env var`,
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro/success?session_id={CHECKOUT_SESSION_ID}&yearly=${args.planId === 'year'}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro`,
        metadata: {
          planId: args.planId,
          userId: user._id,
        },
      });

      console.log('✅ Session created:', session.url);
      return { checkoutUrl: session.url };
    } catch (error) {
      console.error('❌ Checkout error:', error);
      throw error;
    }
  },
});
