import { defineMiddleware } from "astro:middleware";
import { isEditorRequest } from "./editor-affinity";
import { getPerspectiveCookie, isPreviewRequest } from "./preview";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    context.locals.draftMode = false;
    context.locals.editorMode = false;
    context.locals.perspective = undefined;
    return next();
  }

  const draftMode = isPreviewRequest(context.request);
  const editorMode = isEditorRequest(context.request);
  context.locals.draftMode = draftMode;
  context.locals.editorMode = editorMode;
  context.locals.perspective = draftMode
    ? getPerspectiveCookie(context.cookies)
    : undefined;

  const response = await next();

  if (draftMode) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      response.headers.set("Cache-Control", "private, no-store");
    }
  }

  return response;
});
