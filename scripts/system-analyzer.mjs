import fs from 'fs';
import path from 'path';

// 1. Parse Prisma Schema in detail
const prismaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');

const modelBlocks = prismaContent.split(/model\s+(\w+)\s*\{/g);
// modelBlocks[0] is preamble, then [1] is name, [2] is body, [3] is name, etc.
const models = [];
for (let i = 1; i < modelBlocks.length; i += 2) {
  const modelName = modelBlocks[i];
  const rawBody = modelBlocks[i + 1].split('}')[0];
  const lines = rawBody.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  
  const fields = [];
  const indexes = [];
  const uniques = [];

  for (const line of lines) {
    if (line.startsWith('@@index')) {
      indexes.push(line.replace('@@index(', '').replace(')', '').trim());
    } else if (line.startsWith('@@unique')) {
      uniques.push(line.replace('@@unique(', '').replace(')', '').trim());
    } else if (!line.startsWith('@@')) {
      const parts = line.split(/\s+/);
      const fieldName = parts[0];
      const fieldType = parts[1];
      const rest = parts.slice(2).join(' ');
      
      const isId = rest.includes('@id');
      const isUnique = rest.includes('@unique');
      const defaultMatch = rest.match(/@default\(([^)]+)\)/);
      const defaultValue = defaultMatch ? defaultMatch[1] : null;
      const relationMatch = rest.match(/@relation\(([^)]+)\)/);
      const relation = relationMatch ? relationMatch[1] : null;
      
      fields.push({
        name: fieldName,
        type: fieldType,
        isId,
        isUnique,
        defaultValue,
        relation,
        rawAttributes: rest
      });
    }
  }

  models.push({
    name: modelName,
    fieldCount: fields.length,
    fields,
    indexes,
    uniques
  });
}

console.log(`Extracted ${models.length} models from schema.prisma.`);

// 2. Parse APIs in detail
function getFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) getFiles(p, list);
    else list.push(p);
  }
  return list;
}

const apiFiles = getFiles('src/app/api').filter(f => f.endsWith('route.ts') || f.endsWith('route.js'));
const apis = [];

for (const f of apiFiles) {
  const code = fs.readFileSync(f, 'utf8');
  const relPath = f.replace(/\\/g, '/');
  const routePath = relPath.replace('src/app', '').replace(/\/route\.(ts|js)$/, '');
  
  const methods = [];
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)/g;
  let m;
  while ((m = methodRegex.exec(code)) !== null) {
    const method = m[1];
    const params = m[2];

    // Inspect body parsing
    const hasJsonBody = code.includes('.json()');
    const hasSearchParams = code.includes('searchParams');
    const hasAuth = code.includes('getServerSession') || code.includes('authOptions') || code.includes('requirePermission');
    const hasPrisma = code.includes('db.') || code.includes('prisma.');

    methods.push({
      method,
      hasJsonBody,
      hasSearchParams,
      hasAuth,
      hasPrisma
    });
  }

  apis.push({
    file: relPath,
    route: routePath,
    methods
  });
}

console.log(`Extracted ${apis.length} API files with ${apis.reduce((acc, a) => acc + a.methods.length, 0)} methods.`);

// 3. Parse Modules & Components
const moduleDir = 'src/components/modules';
const moduleFiles = fs.readdirSync(moduleDir).filter(f => f.endsWith('.tsx'));
const modulesAnalysis = [];

for (const mf of moduleFiles) {
  const code = fs.readFileSync(path.join(moduleDir, mf), 'utf8');
  const lines = code.split('\n');
  
  // Extract Title / Name
  let title = mf.replace('-module.tsx', '').replace('.tsx', '');
  const titleMatch = code.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/);
  if (titleMatch) {
    const rawH = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, '').trim();
    if (rawH) title = rawH;
  }

  // Extract Buttons
  const buttons = [];
  const btnRegex = /<Button\b([^>]*)>([\s\S]*?)<\/Button>/g;
  let bMatch;
  while ((bMatch = btnRegex.exec(code)) !== null) {
    const props = bMatch[1];
    let label = bMatch[2].replace(/<[^>]+>/g, ' ').replace(/\{[^}]+\}/g, ' ').replace(/\s+/g, ' ').trim();
    if (!label) {
      const aria = props.match(/aria-label=["']([^"']+)["']/);
      const titleProp = props.match(/title=["']([^"']+)["']/);
      label = aria ? aria[1] : (titleProp ? titleProp[1] : 'زر إجراء');
    }
    
    // Handler
    const onClickMatch = props.match(/onClick=\{([^}]+)\}/);
    const isSubmit = props.includes('type="submit"');
    const handler = onClickMatch ? onClickMatch[1].trim() : (isSubmit ? 'إرسال النموذج (Submit)' : 'فتح نافذة / إجراء');

    buttons.push({
      label: label.slice(0, 60),
      handler
    });
  }

  // Extract Forms and Inputs
  const inputMatches = (code.match(/<(Input|Textarea|Select|Switch|Checkbox|RadioGroup)\b/g) || []).length;
  const formMatches = (code.match(/<form\b/g) || []).length;
  
  // Dialogs & Sheets & Alerts
  const hasDialog = code.includes('Dialog') || code.includes('AlertDialog');
  const hasSheet = code.includes('Sheet');
  const hasToast = code.includes('toast') || code.includes('sonner');

  // APIs called
  const apiCalls = [];
  const callRegex = /["'](\/api\/erp\/[^"']+)["']/g;
  let c;
  while ((c = callRegex.exec(code)) !== null) {
    apiCalls.push(c[1]);
  }

  modulesAnalysis.push({
    file: mf,
    title,
    buttonsCount: buttons.length,
    buttons,
    inputsCount: inputMatches,
    hasForm: formMatches > 0,
    hasDialog,
    hasSheet,
    hasToast,
    apiCalls: [...new Set(apiCalls)]
  });
}

console.log(`Extracted ${modulesAnalysis.length} modules with ${modulesAnalysis.reduce((acc, m) => acc + m.buttonsCount, 0)} buttons.`);

// Save comprehensive JSON data for reporting
fs.writeFileSync('system_analysis_data.json', JSON.stringify({
  models,
  apis,
  modules: modulesAnalysis,
  stats: {
    totalModels: models.length,
    totalApiFiles: apis.length,
    totalEndpoints: apis.reduce((acc, a) => acc + a.methods.length, 0),
    totalModules: modulesAnalysis.length,
    totalButtons: modulesAnalysis.reduce((acc, m) => acc + m.buttonsCount, 0)
  }
}, null, 2));

console.log('Successfully written system_analysis_data.json');
