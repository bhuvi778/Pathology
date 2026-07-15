const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Test = require('./models/Test');
const LabSettings = require('./models/LabSettings');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected for seeding...');
};

const tests = [
  {
    name: 'Complete Blood Count (CBC)',
    shortName: 'CBC',
    category: 'hematology',
    price: 500,
    turnaroundTime: '2 hours',
    sampleType: 'EDTA Blood',
    parameters: [
      { name: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: { male: { min: 13.5, max: 17.5, text: '13.5 - 17.5' }, female: { min: 12.0, max: 15.5, text: '12.0 - 15.5' } } },
      { name: 'Total WBC Count', unit: '×10³/μL', normalRange: { general: { min: 4.0, max: 11.0, text: '4.0 - 11.0' } } },
      { name: 'RBC Count', unit: '×10⁶/μL', normalRange: { male: { min: 4.5, max: 5.5, text: '4.5 - 5.5' }, female: { min: 3.8, max: 4.8, text: '3.8 - 4.8' } } },
      { name: 'Hematocrit (HCT)', unit: '%', normalRange: { male: { min: 41, max: 53, text: '41 - 53' }, female: { min: 36, max: 46, text: '36 - 46' } } },
      { name: 'MCV', unit: 'fL', normalRange: { general: { min: 80, max: 100, text: '80 - 100' } } },
      { name: 'MCH', unit: 'pg', normalRange: { general: { min: 27, max: 33, text: '27 - 33' } } },
      { name: 'MCHC', unit: 'g/dL', normalRange: { general: { min: 33, max: 37, text: '33 - 37' } } },
      { name: 'Platelet Count', unit: '×10³/μL', normalRange: { general: { min: 150, max: 400, text: '150 - 400' } } },
      { name: 'Neutrophils', unit: '%', normalRange: { general: { min: 40, max: 70, text: '40 - 70' } } },
      { name: 'Lymphocytes', unit: '%', normalRange: { general: { min: 20, max: 40, text: '20 - 40' } } },
      { name: 'Monocytes', unit: '%', normalRange: { general: { min: 2, max: 10, text: '2 - 10' } } },
      { name: 'Eosinophils', unit: '%', normalRange: { general: { min: 1, max: 6, text: '1 - 6' } } },
      { name: 'Basophils', unit: '%', normalRange: { general: { min: 0, max: 1, text: '0 - 1' } } },
    ],
  },
  {
    name: 'Erythrocyte Sedimentation Rate (ESR)',
    shortName: 'ESR',
    category: 'hematology',
    price: 200,
    turnaroundTime: '1 hour',
    sampleType: 'EDTA Blood',
    parameters: [
      { name: 'ESR (Westergren)', unit: 'mm/hr', normalRange: { male: { min: 0, max: 15, text: '0 - 15' }, female: { min: 0, max: 20, text: '0 - 20' } } },
    ],
  },
  {
    name: 'Blood Group & Rh Factor',
    shortName: 'BG+Rh',
    category: 'hematology',
    price: 300,
    turnaroundTime: '1 hour',
    sampleType: 'EDTA Blood',
    parameters: [
      { name: 'ABO Blood Group', unit: '', type: 'text', normalRange: { general: { text: 'A / B / AB / O' } } },
      { name: 'Rh Factor', unit: '', type: 'options', options: ['Positive', 'Negative'], normalRange: { general: { text: 'Positive / Negative' } } },
    ],
  },
  {
    name: 'Prothrombin Time (PT/INR)',
    shortName: 'PT/INR',
    category: 'hematology',
    price: 600,
    turnaroundTime: '2 hours',
    sampleType: 'Citrate Blood',
    parameters: [
      { name: 'Prothrombin Time (PT)', unit: 'seconds', normalRange: { general: { min: 11, max: 13.5, text: '11 - 13.5' } } },
      { name: 'INR', unit: '', normalRange: { general: { min: 0.9, max: 1.1, text: '0.9 - 1.1' } } },
      { name: 'Control', unit: 'seconds', normalRange: { general: { text: '11 - 13 sec' } } },
    ],
  },
  {
    name: 'Blood Sugar Fasting (BSF)',
    shortName: 'BSF',
    category: 'biochemistry',
    price: 200,
    turnaroundTime: '1 hour',
    sampleType: 'Serum (Fasting)',
    parameters: [
      { name: 'Fasting Blood Glucose', unit: 'mg/dL', normalRange: { general: { min: 70, max: 99, text: '70 - 99 (Normal)  100-125 (Pre-Diabetic)  ≥126 (Diabetic)' } } },
    ],
  },
  {
    name: 'Blood Sugar Random (BSR)',
    shortName: 'BSR',
    category: 'biochemistry',
    price: 200,
    turnaroundTime: '1 hour',
    sampleType: 'Serum',
    parameters: [
      { name: 'Random Blood Glucose', unit: 'mg/dL', normalRange: { general: { min: 70, max: 140, text: '70 - 140 (Normal)  >200 (Diabetic)' } } },
    ],
  },
  {
    name: 'Serum Uric Acid',
    shortName: 'SUA',
    category: 'biochemistry',
    price: 250,
    turnaroundTime: '1 hour',
    sampleType: 'Serum',
    description: 'Method: Uricase; Instrument: Biochemistry Analyser',
    parameters: [
      { name: 'Serum Uric Acid', unit: 'mg/dL', normalRange: { general: { min: 2.7, max: 6.5, text: '2.7 - 6.5' } } },
    ],
  },
  {
    name: 'Glycated Hemoglobin (HbA1c)',
    shortName: 'HbA1c',
    category: 'biochemistry',
    price: 1200,
    turnaroundTime: '4 hours',
    sampleType: 'EDTA Blood',
    parameters: [
      { name: 'HbA1c', unit: '%', normalRange: { general: { min: 4, max: 5.6, text: '<5.7% (Normal)  5.7-6.4% (Pre-Diabetic)  ≥6.5% (Diabetic)' } } },
      { name: 'Estimated Average Glucose', unit: 'mg/dL', normalRange: { general: { text: 'Calculated Value' } } },
    ],
  },
  {
    name: 'Liver Function Tests (LFT)',
    shortName: 'LFT',
    category: 'biochemistry',
    price: 1500,
    turnaroundTime: '4 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'Total Bilirubin', unit: 'mg/dL', normalRange: { general: { min: 0.1, max: 1.2, text: '0.1 - 1.2' } } },
      { name: 'Direct Bilirubin', unit: 'mg/dL', normalRange: { general: { min: 0.0, max: 0.3, text: '0.0 - 0.3' } } },
      { name: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: { general: { min: 0.1, max: 1.0, text: '0.1 - 1.0' } } },
      { name: 'ALT (SGPT)', unit: 'IU/L', normalRange: { male: { min: 7, max: 56, text: '7 - 56' }, female: { min: 7, max: 45, text: '7 - 45' } } },
      { name: 'AST (SGOT)', unit: 'IU/L', normalRange: { male: { min: 10, max: 40, text: '10 - 40' }, female: { min: 10, max: 35, text: '10 - 35' } } },
      { name: 'Alkaline Phosphatase (ALP)', unit: 'IU/L', normalRange: { general: { min: 44, max: 147, text: '44 - 147' } } },
      { name: 'GGT', unit: 'IU/L', normalRange: { male: { min: 8, max: 61, text: '8 - 61' }, female: { min: 5, max: 36, text: '5 - 36' } } },
      { name: 'Total Protein', unit: 'g/dL', normalRange: { general: { min: 6.3, max: 8.2, text: '6.3 - 8.2' } } },
      { name: 'Albumin', unit: 'g/dL', normalRange: { general: { min: 3.5, max: 5.0, text: '3.5 - 5.0' } } },
      { name: 'Globulin', unit: 'g/dL', normalRange: { general: { min: 2.0, max: 3.5, text: '2.0 - 3.5' } } },
      { name: 'A/G Ratio', unit: '', normalRange: { general: { min: 1.2, max: 2.2, text: '1.2 - 2.2' } } },
    ],
  },
  {
    name: 'Kidney Function Tests (KFT)',
    shortName: 'KFT',
    category: 'biochemistry',
    price: 1200,
    turnaroundTime: '4 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'Serum Creatinine', unit: 'mg/dL', normalRange: { male: { min: 0.7, max: 1.3, text: '0.7 - 1.3' }, female: { min: 0.6, max: 1.1, text: '0.6 - 1.1' } } },
      { name: 'Blood Urea', unit: 'mg/dL', normalRange: { general: { min: 7, max: 25, text: '7 - 25' } } },
      { name: 'BUN (Blood Urea Nitrogen)', unit: 'mg/dL', normalRange: { general: { min: 7, max: 20, text: '7 - 20' } } },
      { name: 'Uric Acid', unit: 'mg/dL', normalRange: { male: { min: 3.4, max: 7.0, text: '3.4 - 7.0' }, female: { min: 2.4, max: 6.0, text: '2.4 - 6.0' } } },
      { name: 'Sodium (Na)', unit: 'mEq/L', normalRange: { general: { min: 136, max: 145, text: '136 - 145' } } },
      { name: 'Potassium (K)', unit: 'mEq/L', normalRange: { general: { min: 3.5, max: 5.1, text: '3.5 - 5.1' } } },
      { name: 'Chloride (Cl)', unit: 'mEq/L', normalRange: { general: { min: 98, max: 107, text: '98 - 107' } } },
      { name: 'eGFR', unit: 'mL/min/1.73m²', normalRange: { general: { text: '>60 (Normal)' } } },
    ],
  },
  {
    name: 'Lipid Profile',
    shortName: 'LIPID',
    category: 'biochemistry',
    price: 1200,
    turnaroundTime: '4 hours',
    sampleType: 'Serum (Fasting 12h)',
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', normalRange: { general: { max: 200, text: '<200 (Desirable)  200-239 (Borderline)  ≥240 (High)' } } },
      { name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: { general: { max: 130, text: '<100 (Optimal)  100-129 (Near Optimal)  ≥160 (High)' } } },
      { name: 'HDL Cholesterol', unit: 'mg/dL', normalRange: { male: { min: 40, text: '>40 (Male)' }, female: { min: 50, text: '>50 (Female)' } } },
      { name: 'Triglycerides', unit: 'mg/dL', normalRange: { general: { max: 150, text: '<150 (Normal)  150-199 (Borderline)  ≥200 (High)' } } },
      { name: 'VLDL', unit: 'mg/dL', normalRange: { general: { min: 5, max: 40, text: '5 - 40' } } },
      { name: 'TC/HDL Ratio', unit: '', normalRange: { general: { max: 5.0, text: '<5.0' } } },
    ],
  },
  {
    name: 'Thyroid Profile (T3, T4, TSH)',
    shortName: 'THYROID',
    category: 'hormones',
    price: 2000,
    turnaroundTime: '6 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'TSH (Thyroid Stimulating Hormone)', unit: 'mIU/L', normalRange: { general: { min: 0.4, max: 4.0, text: '0.4 - 4.0' } } },
      { name: 'Free T3 (FT3)', unit: 'pg/mL', normalRange: { general: { min: 2.3, max: 4.2, text: '2.3 - 4.2' } } },
      { name: 'Free T4 (FT4)', unit: 'ng/dL', normalRange: { general: { min: 0.89, max: 1.76, text: '0.89 - 1.76' } } },
    ],
  },
  {
    name: 'Urine Complete Examination (UCE)',
    shortName: 'UCE',
    category: 'urology',
    price: 400,
    turnaroundTime: '2 hours',
    sampleType: 'Midstream Urine',
    parameters: [
      { name: 'Color', unit: '', type: 'text', normalRange: { general: { text: 'Yellow' } } },
      { name: 'Appearance', unit: '', type: 'text', normalRange: { general: { text: 'Clear' } } },
      { name: 'pH', unit: '', normalRange: { general: { min: 4.5, max: 8.0, text: '4.5 - 8.0' } } },
      { name: 'Specific Gravity', unit: '', normalRange: { general: { min: 1.005, max: 1.030, text: '1.005 - 1.030' } } },
      { name: 'Glucose', unit: '', type: 'text', normalRange: { general: { text: 'Negative' } } },
      { name: 'Protein (Albumin)', unit: '', type: 'text', normalRange: { general: { text: 'Negative' } } },
      { name: 'Blood', unit: '', type: 'text', normalRange: { general: { text: 'Negative' } } },
      { name: 'Bilirubin', unit: '', type: 'text', normalRange: { general: { text: 'Negative' } } },
      { name: 'Urobilinogen', unit: '', type: 'text', normalRange: { general: { text: 'Normal' } } },
      { name: 'Nitrite', unit: '', type: 'text', normalRange: { general: { text: 'Negative' } } },
      { name: 'Ketones', unit: '', type: 'text', normalRange: { general: { text: 'Negative' } } },
      { name: 'Leukocyte Esterase', unit: '', type: 'text', normalRange: { general: { text: 'Negative' } } },
      { name: 'RBC (Microscopic)', unit: '/HPF', normalRange: { general: { min: 0, max: 2, text: '0 - 2' } } },
      { name: 'WBC/Pus Cells', unit: '/HPF', normalRange: { general: { min: 0, max: 5, text: '0 - 5' } } },
      { name: 'Epithelial Cells', unit: '', type: 'text', normalRange: { general: { text: 'Few' } } },
      { name: 'Casts', unit: '', type: 'text', normalRange: { general: { text: 'None' } } },
      { name: 'Crystals', unit: '', type: 'text', normalRange: { general: { text: 'None' } } },
      { name: 'Bacteria', unit: '', type: 'text', normalRange: { general: { text: 'None' } } },
    ],
  },
  {
    name: 'HBsAg (Hepatitis B Surface Antigen)',
    shortName: 'HBsAg',
    category: 'serology',
    price: 600,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'HBsAg Result', unit: '', type: 'options', options: ['Non-Reactive', 'Reactive'], normalRange: { general: { text: 'Non-Reactive' } } },
    ],
  },
  {
    name: 'Anti-HCV (Hepatitis C Antibody)',
    shortName: 'Anti-HCV',
    category: 'serology',
    price: 800,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'Anti-HCV Result', unit: '', type: 'options', options: ['Non-Reactive', 'Reactive'], normalRange: { general: { text: 'Non-Reactive' } } },
    ],
  },
  {
    name: 'HIV Test (1 & 2 Antibody)',
    shortName: 'HIV',
    category: 'serology',
    price: 1000,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'HIV 1 & 2 Antibody', unit: '', type: 'options', options: ['Non-Reactive', 'Reactive'], normalRange: { general: { text: 'Non-Reactive' } } },
    ],
  },
  {
    name: 'Widal Test',
    shortName: 'WIDAL',
    category: 'serology',
    price: 500,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'S. typhi "O"', unit: 'Titer', type: 'text', normalRange: { general: { text: 'Negative (<1:80)' } } },
      { name: 'S. typhi "H"', unit: 'Titer', type: 'text', normalRange: { general: { text: 'Negative (<1:80)' } } },
      { name: 'S. paratyphi "AH"', unit: 'Titer', type: 'text', normalRange: { general: { text: 'Negative (<1:80)' } } },
      { name: 'S. paratyphi "BH"', unit: 'Titer', type: 'text', normalRange: { general: { text: 'Negative (<1:80)' } } },
    ],
  },
  {
    name: 'Malaria Antigen Test (RDT)',
    shortName: 'MALARIA',
    category: 'serology',
    price: 700,
    turnaroundTime: '1 hour',
    sampleType: 'EDTA Blood',
    parameters: [
      { name: 'P. Falciparum Antigen', unit: '', type: 'options', options: ['Negative', 'Positive'], normalRange: { general: { text: 'Negative' } } },
      { name: 'P. Vivax Antigen', unit: '', type: 'options', options: ['Negative', 'Positive'], normalRange: { general: { text: 'Negative' } } },
    ],
  },
  {
    name: 'Dengue Profile',
    shortName: 'DENGUE',
    category: 'serology',
    price: 1500,
    turnaroundTime: '3 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'NS1 Antigen', unit: '', type: 'options', options: ['Negative', 'Positive'], normalRange: { general: { text: 'Negative' } } },
      { name: 'Dengue IgM Antibody', unit: '', type: 'options', options: ['Negative', 'Positive'], normalRange: { general: { text: 'Negative' } } },
      { name: 'Dengue IgG Antibody', unit: '', type: 'options', options: ['Negative', 'Positive'], normalRange: { general: { text: 'Negative' } } },
    ],
  },
  {
    name: 'Stool Analysis (Complete)',
    shortName: 'STOOL',
    category: 'microbiology',
    price: 400,
    turnaroundTime: '2 hours',
    sampleType: 'Stool',
    parameters: [
      { name: 'Color', unit: '', type: 'text', normalRange: { general: { text: 'Brown' } } },
      { name: 'Consistency', unit: '', type: 'text', normalRange: { general: { text: 'Semi-Formed' } } },
      { name: 'Blood', unit: '', type: 'text', normalRange: { general: { text: 'Absent' } } },
      { name: 'Mucus', unit: '', type: 'text', normalRange: { general: { text: 'Absent' } } },
      { name: 'Pus Cells (WBC)', unit: '/HPF', normalRange: { general: { min: 0, max: 5, text: '0 - 5' } } },
      { name: 'RBC', unit: '/HPF', normalRange: { general: { min: 0, max: 0, text: 'None' } } },
      { name: 'Cysts', unit: '', type: 'text', normalRange: { general: { text: 'None Seen' } } },
      { name: 'Ova/Parasites', unit: '', type: 'text', normalRange: { general: { text: 'None Seen' } } },
    ],
  },
  {
    name: 'Serum Calcium',
    shortName: 'Ca',
    category: 'biochemistry',
    price: 400,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'Serum Calcium', unit: 'mg/dL', normalRange: { general: { min: 8.5, max: 10.5, text: '8.5 - 10.5' } } },
    ],
  },
  {
    name: 'Vitamin D (25-OH)',
    shortName: 'VIT-D',
    category: 'hormones',
    price: 3000,
    turnaroundTime: '24 hours',
    sampleType: 'Serum',
    parameters: [
      { name: '25-OH Vitamin D', unit: 'ng/mL', normalRange: { general: { min: 30, max: 100, text: '>30 (Sufficient)  20-30 (Insufficient)  <20 (Deficient)' } } },
    ],
  },
  {
    name: 'Vitamin B12',
    shortName: 'B12',
    category: 'hormones',
    price: 2500,
    turnaroundTime: '24 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'Vitamin B12', unit: 'pg/mL', normalRange: { general: { min: 200, max: 900, text: '200 - 900 (Normal)  <200 (Deficient)' } } },
    ],
  },
  {
    name: 'Serum Iron Studies',
    shortName: 'IRON',
    category: 'biochemistry',
    price: 1000,
    turnaroundTime: '4 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'Serum Iron', unit: 'μg/dL', normalRange: { male: { min: 65, max: 175, text: '65 - 175' }, female: { min: 50, max: 170, text: '50 - 170' } } },
      { name: 'TIBC', unit: 'μg/dL', normalRange: { general: { min: 250, max: 370, text: '250 - 370' } } },
      { name: 'Transferrin Saturation', unit: '%', normalRange: { male: { min: 20, max: 50, text: '20 - 50' }, female: { min: 15, max: 50, text: '15 - 50' } } },
    ],
  },
  {
    name: 'X-Ray Chest (PA View)',
    shortName: 'X-RAY',
    category: 'radiology',
    price: 800,
    turnaroundTime: 'Same Day',
    sampleType: 'N/A',
    parameters: [
      { name: 'X-Ray Report', unit: '', type: 'text', normalRange: { general: { text: 'See Report' } } },
    ],
  },
  {
    name: 'Ultrasound Abdomen',
    shortName: 'USG ABD',
    category: 'radiology',
    price: 2000,
    turnaroundTime: 'Same Day',
    sampleType: 'N/A',
    parameters: [
      { name: 'Ultrasound Report', unit: '', type: 'text', normalRange: { general: { text: 'See Report' } } },
    ],
  },
  {
    name: 'ECG (12-Lead)',
    shortName: 'ECG',
    category: 'cardiology',
    price: 500,
    turnaroundTime: 'Immediate',
    sampleType: 'N/A',
    parameters: [
      { name: 'ECG Interpretation', unit: '', type: 'text', normalRange: { general: { text: 'See Report' } } },
      { name: 'Heart Rate', unit: 'bpm', normalRange: { general: { min: 60, max: 100, text: '60 - 100' } } },
      { name: 'PR Interval', unit: 'ms', normalRange: { general: { min: 120, max: 200, text: '120 - 200' } } },
      { name: 'QRS Duration', unit: 'ms', normalRange: { general: { min: 70, max: 110, text: '70 - 110' } } },
      { name: 'QTc Interval', unit: 'ms', normalRange: { general: { max: 440, text: '<440 (Male)  <460 (Female)' } } },
    ],
  },
  {
    name: 'Serum Urea & Creatinine',
    shortName: 'UREA-CR',
    category: 'biochemistry',
    price: 600,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'Serum Urea', unit: 'mg/dL', normalRange: { general: { min: 15, max: 45, text: '15 - 45' } } },
      { name: 'Serum Creatinine', unit: 'mg/dL', normalRange: { male: { min: 0.7, max: 1.3, text: '0.7 - 1.3' }, female: { min: 0.6, max: 1.1, text: '0.6 - 1.1' } } },
    ],
  },
  {
    name: 'C-Reactive Protein (CRP)',
    shortName: 'CRP',
    category: 'serology',
    price: 800,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'CRP (Qualitative)', unit: '', type: 'options', options: ['Non-Reactive', 'Reactive'], normalRange: { general: { text: 'Non-Reactive' } } },
      { name: 'CRP (Quantitative)', unit: 'mg/L', normalRange: { general: { max: 6, text: '<6.0' } } },
    ],
  },
  {
    name: 'Rheumatoid Factor (RA)',
    shortName: 'RA',
    category: 'serology',
    price: 700,
    turnaroundTime: '2 hours',
    sampleType: 'Serum',
    parameters: [
      { name: 'RA Factor (Qualitative)', unit: '', type: 'options', options: ['Non-Reactive', 'Reactive'], normalRange: { general: { text: 'Non-Reactive' } } },
      { name: 'RA Titer', unit: 'IU/mL', normalRange: { general: { max: 14, text: '<14 (Normal)' } } },
    ],
  },
];

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Test.deleteMany({});
    await LabSettings.deleteMany({});
    console.log('Cleared existing data');

    // Create Lab Settings
    await LabSettings.create({
      labName: 'Shri Dhanvantari Pathology & Diagnostic Centre',
      labAddress: '42, Nehru Nagar, Near District Hospital, Lucknow, Uttar Pradesh - 226001',
      labPhone: '+91-522-2601234',
      labEmail: 'info@dhanvantarilab.in',
      labDirector: 'Dr. Rajesh Kumar Sharma',
      labDirectorQualification: 'MBBS, MD (Pathology), NABL Accredited',
      reportFooter: 'This report is confidential and intended for the referring physician only. Please correlate clinically. Helpline: +91-522-2601234',
      registrationNumber: 'UP-DL-2019-04521',
    });
    console.log('Lab settings created');

    // Create Doctors
    const doctor1 = await Doctor.create({
      name: 'Dr. Rajesh Kumar Sharma',
      specialty: 'Pathologist',
      qualifications: 'MBBS, MD (Pathology), NABL Accredited',
      phone: '+91-98765-43210',
      email: 'dr.rajesh@dhanvantarilab.in',
      pmcNumber: 'UP-MCI-2008-12345',
      consultationFee: 0,
    });

    const doctor2 = await Doctor.create({
      name: 'Dr. Priya Agarwal',
      specialty: 'Hematologist',
      qualifications: 'MBBS, DNB (Hematology), FIAP',
      phone: '+91-97654-32109',
      email: 'dr.priya@dhanvantarilab.in',
      pmcNumber: 'UP-MCI-2012-67890',
      consultationFee: 0,
    });

    const doctor3 = await Doctor.create({
      name: 'Dr. Amit Verma',
      specialty: 'General Physician',
      qualifications: 'MBBS, MD (General Medicine)',
      phone: '+91-96543-21098',
      email: 'dr.amit@dhanvantarilab.in',
      pmcNumber: 'UP-MCI-2015-11111',
      consultationFee: 300,
    });
    console.log('Doctors created');

    // Create Users
    const admin = await User.create({
      name: 'Suresh Kumar Pandey',
      email: 'admin@dhanvantarilab.in',
      password: 'Admin@2026',
      role: 'admin',
      phone: '+91-98001-00001',
    });

    const receptionist = await User.create({
      name: 'Sunita Devi Gupta',
      email: 'reception@dhanvantarilab.in',
      password: 'Reception@2026',
      role: 'receptionist',
      phone: '+91-98001-00002',
    });

    const doctorUser1 = await User.create({
      name: 'Dr. Rajesh Kumar Sharma',
      email: 'dr.rajesh@dhanvantarilab.in',
      password: 'Rajesh@2026',
      role: 'doctor',
      phone: '+91-98765-43210',
      doctorProfile: doctor1._id,
    });

    const doctorUser2 = await User.create({
      name: 'Dr. Priya Agarwal',
      email: 'dr.priya@dhanvantarilab.in',
      password: 'Priya@2026',
      role: 'doctor',
      phone: '+91-97654-32109',
      doctorProfile: doctor2._id,
    });

    const doctorUser3 = await User.create({
      name: 'Dr. Amit Verma',
      email: 'dr.amit@dhanvantarilab.in',
      password: 'Amit@2026',
      role: 'doctor',
      phone: '+91-96543-21098',
      doctorProfile: doctor3._id,
    });

    // Link doctor users
    await Doctor.findByIdAndUpdate(doctor1._id, { user: doctorUser1._id });
    await Doctor.findByIdAndUpdate(doctor2._id, { user: doctorUser2._id });
    await Doctor.findByIdAndUpdate(doctor3._id, { user: doctorUser3._id });
    console.log('Users created');

    // Create Tests
    await Test.insertMany(tests);
    console.log(`${tests.length} tests created`);

    console.log('\n===================================');
    console.log('DATABASE SEEDED SUCCESSFULLY! (India - 2026)');
    console.log('===================================');
    console.log('Lab: Shri Dhanvantari Pathology & Diagnostic Centre');
    console.log('Login Credentials:');
    console.log('  Admin:        admin@dhanvantarilab.in       / Admin@2026');
    console.log('  Receptionist: reception@dhanvantarilab.in   / Reception@2026');
    console.log('  Dr. Rajesh:   dr.rajesh@dhanvantarilab.in   / Rajesh@2026');
    console.log('  Dr. Priya:    dr.priya@dhanvantarilab.in    / Priya@2026');
    console.log('  Dr. Amit:     dr.amit@dhanvantarilab.in     / Amit@2026');
    console.log('===================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
