import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../..');

function getSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
        getSourceFiles(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

test('Import Boundaries - Customer UI must not import from (pharmacy) or components/portal', () => {
  const customerDirs = [
    path.join(srcDir, 'app/(tabs)'),
    path.join(srcDir, 'components/home'),
    path.join(srcDir, 'components/onboarding'),
    path.join(srcDir, 'components/care'),
    path.join(srcDir, 'components/search'),
    path.join(srcDir, 'components/medicinebox'),
  ];

  const customerIndividualFiles = [
    path.join(srcDir, 'app/profile.tsx'),
    path.join(srcDir, 'app/medicine-box.tsx'),
    path.join(srcDir, 'app/emergency-directory.tsx'),
    path.join(srcDir, 'app/medicine/[id].tsx'),
  ];

  const customerFiles = [];
  for (const dir of customerDirs) {
    getSourceFiles(dir, customerFiles);
  }
  for (const file of customerIndividualFiles) {
    if (fs.existsSync(file)) {
      customerFiles.push(file);
    }
  }

  assert.ok(customerFiles.length > 5, 'Should collect customer UI files');

  const violations = [];
  const pharmacyImportPattern = /from\s+['"][^'"]*(\(pharmacy\)|components\/portal)[^'"]*['"]/g;

  for (const file of customerFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = pharmacyImportPattern.exec(content)) !== null) {
      violations.push({
        file: path.relative(srcDir, file),
        importStatement: match[0],
      });
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Customer UI files must not import from (pharmacy) or components/portal: ${JSON.stringify(violations, null, 2)}`
  );
});

test('Import Boundaries - Pharmacy screens must not import Customer UI modules', () => {
  const pharmacyDir = path.join(srcDir, 'app/(pharmacy)');
  const pharmacyFiles = getSourceFiles(pharmacyDir);

  assert.ok(pharmacyFiles.length >= 2, 'Should find files in src/app/(pharmacy)');

  // Prohibited customer UI patterns for pharmacy files:
  // tabs, onboarding, home components, care, search, medicinebox, medicine-box, profile, emergency-directory
  const customerUIPattern =
    /from\s+['"][^'"]*(\(tabs\)|components\/onboarding|components\/home|components\/care|components\/search|components\/medicinebox|app\/profile|app\/medicine-box|app\/emergency-directory|medicine\/\[id\])[^'"]*['"]/g;

  const violations = [];
  for (const file of pharmacyFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = customerUIPattern.exec(content)) !== null) {
      violations.push({
        file: path.relative(srcDir, file),
        importStatement: match[0],
      });
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Pharmacy files must not import customer UI modules: ${JSON.stringify(violations, null, 2)}`
  );
});

test('Import Boundaries - Both trees are wrapped by the same shared providers in _layout.tsx', () => {
  const rootLayoutPath = path.join(srcDir, 'app/_layout.tsx');
  const layoutContent = fs.readFileSync(rootLayoutPath, 'utf8');

  // Verify common providers wrap the entire RootLayout:
  assert.ok(layoutContent.includes('<ThemeProvider>'), 'RootLayout must wrap with ThemeProvider');
  assert.ok(layoutContent.includes('<LanguageProvider>'), 'RootLayout must wrap with LanguageProvider');
  assert.ok(layoutContent.includes('<LocationProvider>'), 'RootLayout must wrap with LocationProvider');
  assert.ok(layoutContent.includes('<ProfileProvider>'), 'RootLayout must wrap with ProfileProvider');
  assert.ok(layoutContent.includes('<MedicineBoxProvider>'), 'RootLayout must wrap with MedicineBoxProvider');
});
