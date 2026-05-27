import { trpc } from "~/trpc/client";

export const useListMyForms = () => {
    const query = trpc.form.listMyForms.useQuery({});

    return {
        forms: query.data?.items ?? [],
        ...query,
    };
};

export const useCreateDraft = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.form.createDraft.useMutation({
        onSuccess: async () => {
            await utils.form.listMyForms.invalidate();
        },
    });

    return {
        createDraftAsync: mutation.mutateAsync,
        createDraft: mutation.mutate,
        ...mutation,
    };
};

export const useMyFormById = (id: string | undefined) => {
    const query = trpc.form.getMyFormById.useQuery(
        { id: id! },
        { enabled: Boolean(id), retry: false },
    );

    return query;
};

export const usePublishedFormById = (
    id: string | undefined,
    password?: string,
    options?: { enabled?: boolean },
) => {
    const query = trpc.form.getPublishedFormById.useQuery(
        { id: id!, password },
        {
            enabled: Boolean(id) && (options?.enabled ?? true),
            retry: false,
        },
    );

    return query;
};

export const useSaveDraft = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.form.saveDraft.useMutation({
        onSuccess: async (_data, variables) => {
            await utils.form.getMyFormById.invalidate({ id: variables.id });
        },
    });

    return {
        saveDraftAsync: mutation.mutateAsync,
        saveDraft: mutation.mutate,
        ...mutation,
    };
};

export const usePublishForm = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.form.publishForm.useMutation({
        onSuccess: async (_data, variables) => {
            await Promise.all([
                utils.form.listMyForms.invalidate(),
                utils.form.getMyFormById.invalidate({ id: variables.id }),
                utils.form.getPublishedFormById.invalidate({ id: variables.id }),
            ]);
        },
    });

    return {
        publishFormAsync: mutation.mutateAsync,
        publishForm: mutation.mutate,
        ...mutation,
    };
};

export const useUnpublishForm = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.form.unpublishForm.useMutation({
        onSuccess: async (_data, variables) => {
            await Promise.all([
                utils.form.listMyForms.invalidate(),
                utils.form.getMyFormById.invalidate({ id: variables.id }),
            ]);
        },
    });

    return {
        unpublishFormAsync: mutation.mutateAsync,
        unpublishForm: mutation.mutate,
        ...mutation,
    };
};

export const useUpdateFormVisibility = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.form.updateVisibility.useMutation({
        onSuccess: async (_data, variables) => {
            await Promise.all([
                utils.form.listMyForms.invalidate(),
                utils.form.getMyFormById.invalidate({ id: variables.id }),
            ]);
        },
    });

    return {
        updateVisibilityAsync: mutation.mutateAsync,
        updateVisibility: mutation.mutate,
        ...mutation,
    };
};

export const useUpdateFormSettings = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.form.updateFormSettings.useMutation({
        onSuccess: async (_data, variables) => {
            await Promise.all([
                utils.form.listMyForms.invalidate(),
                utils.form.getMyFormById.invalidate({ id: variables.id }),
                utils.form.getPublishedFormById.invalidate({ id: variables.id }),
            ]);
        },
    });

    return {
        updateFormSettingsAsync: mutation.mutateAsync,
        updateFormSettings: mutation.mutate,
        ...mutation,
    };
};

export const useDeleteForm = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.form.deleteForm.useMutation({
        onSuccess: async () => {
            await utils.form.listMyForms.invalidate();
        },
    });

    return {
        deleteFormAsync: mutation.mutateAsync,
        deleteForm: mutation.mutate,
        ...mutation,
    };
};

export const useListPublicForms = (limit = 20, offset = 0) => {
    const query = trpc.form.listPublicForms.useQuery({ limit, offset });

    return {
        forms: query.data?.items ?? [],
        ...query,
    };
};
