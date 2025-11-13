const ALUMNI_IMAGES = [
  '/assets/alumni/student1.jpeg',
  '/assets/alumni/student2.jpg',
  '/assets/alumni/student3.jpg',
  '/assets/alumni/student4.jpg',
  '/assets/alumni/student5.jpg',
  '/assets/alumni/student6.jpeg',
  '/assets/alumni/student7.jpg',
  '/assets/alumni/student8.jpg',
  '/assets/alumni/student9.jpg',
  '/assets/alumni/student10.jpg',
  '/assets/alumni/student11.jpeg',
  '/assets/alumni/student12.jpeg',
];

export const getAlumniImage = (studentKey) => {
  if (!studentKey || Number.isNaN(Number(studentKey))) {
    return ALUMNI_IMAGES[0];
  }
  const index = (Number(studentKey) - 1) % ALUMNI_IMAGES.length;
  return ALUMNI_IMAGES[index];
};

export const getAlumniImageByIndex = (index = 0) => {
  if (ALUMNI_IMAGES.length === 0) return '';
  const safeIndex = index % ALUMNI_IMAGES.length;
  return ALUMNI_IMAGES[safeIndex];
};

