import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    stripeCustomerId: v.string(),
    currentSubscriptionId: v.optional(v.id('subscriptions')),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_stripeCustomerId', ['stripeCustomerId'])
    .index('by_currentSubscriptionId', ['currentSubscriptionId']),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    price: v.number(),
  }),

  purchases: defineTable({
    userId: v.id('users'),
    courseId: v.id('courses'),
    stripePurchaseId: v.string(),
    amount: v.number(),
    purchaseDate: v.number(), // unix timestamp
  }).index('by_userId_and_courseId', ['userId', 'courseId']),

  subscriptions: defineTable({
    userId: v.id('users'),
    stripeSubscriptionId: v.string(),
    planType: v.union(v.literal('month'), v.literal('year')),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    status: v.string(),
    cancelAtPeriodEnd: v.boolean(),
  }).index('by_stripeSubscriptionId', ['stripeSubscriptionId']),
});
