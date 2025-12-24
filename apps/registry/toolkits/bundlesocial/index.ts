import { Toolkit } from "kernl";

import { createPost } from "./posts/create";
import { listPosts } from "./posts/list";
import { getPost } from "./posts/get";
import { updatePost } from "./posts/update";
import { deletePost } from "./posts/delete";
import { retryPost } from "./posts/retry";

import { getPostAnalytics } from "./analytics/post";
import { getAccountAnalytics } from "./analytics/account";

import { createComment } from "./comments/create";
import { listComments } from "./comments/list";
import { deleteComment } from "./comments/delete";

export { client } from "./client";

export { PLATFORMS, type Platform } from "./constants";

export const bundlesocial = new Toolkit({
  id: "bundlesocial",
  description:
    "Social media API for scheduling and publishing posts across multiple platforms",
  tools: [
    createPost,
    listPosts,
    getPost,
    updatePost,
    deletePost,
    retryPost,
    getPostAnalytics,
    getAccountAnalytics,
    createComment,
    listComments,
    deleteComment,
  ],
});
