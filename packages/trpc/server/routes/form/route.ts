import {
    authenticatedProcedure,
    optionallyAuthenticatedProcedure,
    publicProcedure,
    router,
} from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { formService } from "../../services";
import { toPublicTRPCError } from "../../utils/public-error";
import {
    createDraftFormInputModel,
    createDraftFormOutputModel,
    deleteFormInputModel,
    deleteFormOutputModel,
    getFormByIdInputModel,
    getMyFormByIdOutputModel,
    getPublishedFormByIdInputModel,
    getPublishedFormByIdOutputModel,
    listMyFormsInputModel,
    listMyFormsOutputModel,
    listPublicFormsInputModel,
    listPublicFormsOutputModel,
    publishFormInputModel,
    publishFormOutputModel,
    saveDraftFormInputModel,
    saveDraftFormOutputModel,
    unpublishFormInputModel,
    unpublishFormOutputModel,
    updateFormSettingsInputModel,
    updateFormSettingsOutputModel,
    updateFormVisibilityInputModel,
    updateFormVisibilityOutputModel,
} from "./model";

const TAGS = ["Forms"];
const getPath = generatePath("/forms");

export const formRouter = router({
    createDraft: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/createDraft"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(createDraftFormInputModel)
        .output(createDraftFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await formService.createDraft(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while creating your form.", {
                    path: "form.createDraft",
                });
            }
        }),

    saveDraft: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/saveDraft"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(saveDraftFormInputModel)
        .output(saveDraftFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await formService.saveDraft(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while saving your form.", {
                    path: "form.saveDraft",
                });
            }
        }),

    publishForm: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/publishForm"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(publishFormInputModel)
        .output(publishFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await formService.publishForm(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while publishing your form.", {
                    path: "form.publishForm",
                });
            }
        }),

    unpublishForm: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/unpublishForm"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(unpublishFormInputModel)
        .output(unpublishFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await formService.unpublishForm(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "Something went wrong while unpublishing your form.",
                    {
                        path: "form.unpublishForm",
                    },
                );
            }
        }),

    updateVisibility: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/updateVisibility"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(updateFormVisibilityInputModel)
        .output(updateFormVisibilityOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await formService.updateVisibility(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while updating visibility.", {
                    path: "form.updateVisibility",
                });
            }
        }),

    deleteForm: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/deleteForm"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(deleteFormInputModel)
        .output(deleteFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await formService.deleteForm(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while deleting your form.", {
                    path: "form.deleteForm",
                });
            }
        }),

    getMyFormById: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getMyFormById"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(getFormByIdInputModel)
        .output(getMyFormByIdOutputModel)
        .query(async ({ input, ctx }) => {
            try {
                return await formService.getMyFormById(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while loading your form.", {
                    path: "form.getMyFormById",
                });
            }
        }),

    getPublishedFormById: optionallyAuthenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getPublishedFormById"),
                tags: TAGS,
            },
        })
        .input(getPublishedFormByIdInputModel)
        .output(getPublishedFormByIdOutputModel)
        .query(async ({ input, ctx }) => {
            try {
                return await formService.getPublishedFormById(input, ctx.user?.id ?? null);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while loading this form.", {
                    path: "form.getPublishedFormById",
                });
            }
        }),

    updateFormSettings: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/updateFormSettings"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(updateFormSettingsInputModel)
        .output(updateFormSettingsOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await formService.updateFormSettings(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while updating your form.", {
                    path: "form.updateFormSettings",
                });
            }
        }),

    listMyForms: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/listMyForms"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(listMyFormsInputModel)
        .output(listMyFormsOutputModel)
        .query(async ({ ctx }) => {
            const items = await formService.listMyForms(ctx.user.id);
            return { items };
        }),

    listPublicForms: publicProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/listPublicForms"),
                tags: TAGS,
            },
        })
        .input(listPublicFormsInputModel)
        .output(listPublicFormsOutputModel)
        .query(async ({ input }) => {
            const items = await formService.listPublicForms(input);
            return { items };
        }),
});
