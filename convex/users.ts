import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { ConvexError, v } from 'convex/values';

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (existingUser) {
      console.log('User already exists');
      return existingUser._id;
    }

    const userId = await ctx.db.insert('users', {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      stripeCustomerId: args.stripeCustomerId,
    });

    console.log('User created successfully');
    return userId;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const clerkUser = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    return clerkUser;
  },
});

export const getUserByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const stripeUser = await ctx.db
      .query('users')
      .withIndex('by_stripeCustomerId', (q) =>
        q.eq('stripeCustomerId', args.stripeCustomerId),
      )
      .unique();
    return stripeUser;
  },
});

export const getUserAccess = query({
  args: { userId: v.id('users'), courseId: v.id('courses') },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError('User not found');

    // Check if user is authenticated
    const isAuth = await ctx.auth.getUserIdentity();
    if (!isAuth) throw new ConvexError('Unauthorized');

    // Check for the user subscription
    if (user.currentSubscriptionId) {
      const subscription = await ctx.db.get(
        user.currentSubscriptionId as Id<'subscriptions'>,
      );

      if (subscription && subscription.status === 'active') {
        return { hasAccess: true, accessType: 'subscription' };
      }
    }

    // Check for individual course access
    const purchase = await ctx.db
      .query('purchases')
      .withIndex('by_userId_and_courseId', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId),
      )
      .unique();

    if (purchase) {
      return { hasAccess: true, accessType: 'course' };
    }

    return { hasAccess: false };
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError('User not found');
    }

    await ctx.db.patch(user._id, {
      email: args.email,
      name: args.name,
    });

    return user._id;
  },
});

export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError('User not found');
    }

    await ctx.db.delete(user._id);

    return user._id;
  },
});
