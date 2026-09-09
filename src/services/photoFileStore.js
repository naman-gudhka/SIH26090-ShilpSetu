let photoFile = null;

export const photoFileStore = {
  set(file) {
    photoFile = file;
  },

  get() {
    return photoFile;
  },

  clear() {
    photoFile = null;
  },
};