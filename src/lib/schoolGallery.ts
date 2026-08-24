// Keep school gallery URLs consistent everywhere in the app.
// We can move this to a database slug later if chapters grow much larger.
export const schoolToGallerySlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  
  export const schoolGalleryPath = (name: string) =>
    `/galleries/${schoolToGallerySlug(name)}`;