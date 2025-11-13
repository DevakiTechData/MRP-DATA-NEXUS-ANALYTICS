const EMPLOYER_IMAGES = [
  '/assets/employers/Comp img1.jpeg',
  '/assets/employers/Comp img2.jpg',
  '/assets/employers/Comp img3.webp',
  '/assets/employers/Comp img4.jpg',
  '/assets/employers/Comp img5.webp',
];

export const getEmployerImageByIndex = (index = 0) => {
  if (EMPLOYER_IMAGES.length === 0) return '';
  const safeIndex = Math.abs(index) % EMPLOYER_IMAGES.length;
  return EMPLOYER_IMAGES[safeIndex];
};

export const getEmployerImage = (employerKey) => {
  if (EMPLOYER_IMAGES.length === 0) return '';
  if (employerKey === undefined || employerKey === null) {
    return EMPLOYER_IMAGES[0];
  }
  const numeric = Number(employerKey);
  if (Number.isNaN(numeric)) {
    return EMPLOYER_IMAGES[0];
  }
  const safeIndex = (numeric - 1) % EMPLOYER_IMAGES.length;
  return EMPLOYER_IMAGES[safeIndex];
};

