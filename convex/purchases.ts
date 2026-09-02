import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const recordPurchase = mutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
    stripePurchaseId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, courseId, stripePurchaseId, amount } = args;

    const purchaseId = await ctx.db.insert('purchases', {
      courseId,
      userId,
      stripePurchaseId,
      amount,
      purchaseDate: Date.now(),
    });

    return purchaseId;
  },
});
