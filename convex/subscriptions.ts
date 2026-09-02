import { query, mutation } from './_generated/server';
import { ConvexError, v } from 'convex/values';

export const getUserSubscription = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.currentSubscriptionId) return null;

    const subscription = await ctx.db.get(user?.currentSubscriptionId);
    if (!subscription) return null;

    return subscription;
  },
});
export const cancelSubscriptionAtPeriodEnd = mutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .unique();

    if (!subscription) {
      throw new ConvexError('Subscription not found');
    }

    // Toggle the current value (true → false, false → true)
    const newCancelAtPeriodEnd = !subscription.cancelAtPeriodEnd;

    console.log('New_Canceled: ', newCancelAtPeriodEnd);
    console.log('Prev_Canceled: ', subscription.cancelAtPeriodEnd);

    // Patch subscription record
    await ctx.db.patch(subscription._id, {
      cancelAtPeriodEnd: newCancelAtPeriodEnd,
    });
  },
});

export const upsertSubscription = mutation({
  args: {
    userId: v.id('users'),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    planType: v.union(v.literal('month'), v.literal('year')),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, stripeSubscriptionId } = args;

    const existingSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', stripeSubscriptionId),
      )
      .unique();

    if (existingSubscription) {
      // // Update existing subscription
      await ctx.db.patch(existingSubscription._id, args);
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert('subscriptions', args);
      // Update user document
      await ctx.db.patch(userId, { currentSubscriptionId: subscriptionId });
    }
  },
});

export const removeSubscription = mutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .unique();

    // If subscription doesn't exist, just return success
    if (!subscription) {
      console.log(
        `Subscription ${args.stripeSubscriptionId} not found, skipping`,
      );
      return { success: true };
    }

    // Remove from user
    const user = await ctx.db
      .query('users')
      .withIndex('by_currentSubscriptionId', (q) =>
        q.eq('currentSubscriptionId', subscription._id),
      )
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { currentSubscriptionId: undefined });
    }

    // Delete the subscription
    await ctx.db.delete(subscription._id);

    return { success: true };
  },
});
