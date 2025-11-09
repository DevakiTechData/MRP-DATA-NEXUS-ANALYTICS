import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STUDENTS_PATH = path.join(__dirname, '..', 'public', 'Dim_Students.csv');

const updateGenderDistribution = () => {
  const csvRaw = fs.readFileSync(STUDENTS_PATH, 'utf-8');
  const parsed = Papa.parse(csvRaw, {
    header: true,
    skipEmptyLines: true,
  });

  const students = parsed.data;
  if (!students.length) {
    console.warn('No student records found. Exiting gender update.');
    return;
  }

  const total = students.length;
  const maleTarget = Math.round(total * 0.6);
  const femaleTarget = total - maleTarget;

  let maleAssigned = 0;
  let femaleAssigned = 0;

  const normalizedStudents = students.map((student, index) => {
    const updatedStudent = { ...student };
    if (maleAssigned < maleTarget) {
      updatedStudent.gender = 'Male';
      maleAssigned += 1;
    } else if (femaleAssigned < femaleTarget) {
      updatedStudent.gender = 'Female';
      femaleAssigned += 1;
    } else {
      // Fallback (should rarely occur due to rounding) assign remaining to Female
      updatedStudent.gender = 'Female';
      femaleAssigned += 1;
    }
    return updatedStudent;
  });

  console.log(`Updated gender distribution -> Male: ${maleAssigned}, Female: ${femaleAssigned}`);

  const csvOutput = Papa.unparse(normalizedStudents, {
    quotes: true,
  });

  fs.writeFileSync(STUDENTS_PATH, csvOutput, 'utf-8');
  console.log(`Successfully wrote updated data to ${STUDENTS_PATH}`);
};

updateGenderDistribution();

