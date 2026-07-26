import { definePlugin } from "sanity";
import { HeicImageInput } from "../../inputs/HeicImageInput";

export const heicUploadPlugin = definePlugin({
  name: "heic-upload",
  form: {
    components: {
      input: HeicImageInput,
    },
  },
});
