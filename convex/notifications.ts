import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getNotifications = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUser._id))
      .order("desc")
      .collect();

    const notificationsWithInfo = await Promise.all(
      notifications.map(async (noti) => {
        const sender = (await ctx.db.get(noti.senderId))!;
        let post = null;
        let comment = null;

        if (noti.postId) {
          post = await ctx.db.get(noti.postId);
        }

        if (noti.type === "comment" && noti.commentId) {
          comment = await ctx.db.get(noti.commentId);
        }

        return {
          ...noti,
          sender: {
            _id: sender._id,
            username: sender.username,
            image: sender.image,
          },
          post,
          comment: comment?.content,
        };
      })
    );

    return notificationsWithInfo;
  },
});
