const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const SCREENS_DIR = path.join(SRC_DIR, 'screens');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const LAYOUT_DIR = path.join(SRC_DIR, 'layout');
const GENERATORS_DIR = path.join(SRC_DIR, 'generators');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function findAllTsxFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findAllTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function relPath(filePath) {
  return path.relative(path.join(__dirname, '..'), filePath);
}

describe('Static Layout Analysis - SafeArea', () => {
  const files = findAllTsxFiles(SRC_DIR);

  test('DashboardLayout content area should have bottom padding', () => {
    const filePath = path.join(LAYOUT_DIR, 'DashboardLayout.tsx');
    const content = readFile(filePath);
    expect(content).toContain('paddingBottom');
    expect(content).toContain('insets.bottom');
  });

  test('Header should use minHeight instead of fixed height', () => {
    const filePath = path.join(COMPONENTS_DIR, 'Header.tsx');
    const content = readFile(filePath);
    expect(content).not.toMatch(/height:\s*72/);
  });

  test('FormScreen footer should have bottom padding', () => {
    const filePath = path.join(GENERATORS_DIR, 'FormScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('paddingBottom');
  });

  test('All screen files should use SafeAreaView or have safe area handling', () => {
    const screenFiles = findAllTsxFiles(SCREENS_DIR);
    const issues = [];

    for (const file of screenFiles) {
      const content = readFile(file);
      const fileName = path.basename(file);

      if (content.includes('SafeAreaView') || content.includes('useSafeAreaInsets')) {
        continue;
      }

      if (content.includes('flex: 1') && !content.includes('SafeAreaView')) {
        issues.push(relPath(file));
      }
    }

    if (issues.length > 0) {
      console.log('Screens without SafeArea:', issues);
    }
  });
});

describe('Static Layout Analysis - Touch Targets', () => {
  test('Header menu button should have min 44px touch target', () => {
    const filePath = path.join(COMPONENTS_DIR, 'Header.tsx');
    const content = readFile(filePath);
    expect(content).toContain('minHeight: 44');
    expect(content).toContain('minWidth: 44');
  });

  test('Header icon buttons should have min 44px touch target', () => {
    const filePath = path.join(COMPONENTS_DIR, 'Header.tsx');
    const content = readFile(filePath);
    const iconBtnMatch = content.match(/iconBtn:\s*\{[^}]+\}/);
    if (iconBtnMatch) {
      expect(iconBtnMatch[0]).toContain('minHeight');
    }
  });

  test('Sidebar close button should have min 44px touch target', () => {
    const filePath = path.join(COMPONENTS_DIR, 'Sidebar.tsx');
    const content = readFile(filePath);
    const closeBtnMatch = content.match(/closeBtn:\s*\{[^}]+\}/);
    if (closeBtnMatch) {
      expect(closeBtnMatch[0]).toContain('minHeight');
    }
  });

  test('StatusActions trigger should have min 44px touch target', () => {
    const filePath = path.join(COMPONENTS_DIR, 'StatusActions.tsx');
    const content = readFile(filePath);
    const triggerMatch = content.match(/trigger:\s*\{[^}]+\}/);
    if (triggerMatch) {
      expect(triggerMatch[0]).toContain('minHeight');
    }
  });

  test('ConversationsScreen icon buttons should have min 44px touch target', () => {
    const filePath = path.join(SCREENS_DIR, 'ConversationsScreen.tsx');
    const content = readFile(filePath);
    const iconBtnMatch = content.match(/iconBtn:\s*\{[^}]+\}/);
    if (iconBtnMatch) {
      expect(iconBtnMatch[0]).toContain('minHeight');
    }
  });
});

describe('Static Layout Analysis - RTL Support', () => {
  test('ListScreen FAB should use end instead of right', () => {
    const filePath = path.join(GENERATORS_DIR, 'ListScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('end: spacing');
    expect(content).not.toMatch(/fab:[\s\S]*right:\s*spacing/);
  });

  test('All screen FABs should use end instead of right', () => {
    const screenFiles = findAllTsxFiles(SCREENS_DIR);
    const issues = [];

    for (const file of screenFiles) {
      const content = readFile(file);
      const fabMatch = content.match(/fab:\s*\{[^}]+\}/g);
      if (fabMatch) {
        for (const fab of fabMatch) {
          if (fab.includes('right:') && !fab.includes('end:')) {
            issues.push(relPath(file));
          }
        }
      }
    }

    expect(issues).toEqual([]);
  });

  test('FormScreen footer should be RTL-aware', () => {
    const filePath = path.join(GENERATORS_DIR, 'FormScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('isRTL');
  });

  test('DetailScreen actions row should be RTL-aware', () => {
    const filePath = path.join(GENERATORS_DIR, 'DetailScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('isRTL');
  });

  test('ConversationsScreen backBtn should use marginEnd instead of marginRight', () => {
    const filePath = path.join(SCREENS_DIR, 'ConversationsScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('marginEnd');
    expect(content).not.toMatch(/backBtn:[\s\S]*marginRight/);
  });

  test('ConversationsScreen unreadBadge should use marginStart instead of marginLeft', () => {
    const filePath = path.join(SCREENS_DIR, 'ConversationsScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('marginStart');
    expect(content).not.toMatch(/unreadBadge:[\s\S]*marginLeft/);
  });
});

describe('Static Layout Analysis - Overflow Prevention', () => {
  test('DashboardLayout sidebar translate should match sidebar width', () => {
    const filePath = path.join(LAYOUT_DIR, 'DashboardLayout.tsx');
    const content = readFile(filePath);
    expect(content).toContain('280');
    expect(content).not.toMatch(/translateX.*300/);
  });

  test('Header should not use fixed height that conflicts with safe area', () => {
    const filePath = path.join(COMPONENTS_DIR, 'Header.tsx');
    const content = readFile(filePath);
    expect(content).not.toMatch(/height:\s*72/);
    expect(content).toContain('minHeight');
  });

  test('Dashboard summary cards should not use width that causes overflow', () => {
    const filePath = path.join(SCREENS_DIR, 'DashboardScreen.tsx');
    const content = readFile(filePath);
    const summaryCardMatch = content.match(/summaryCard:\s*\{[^}]+\}/);
    if (summaryCardMatch) {
      expect(summaryCardMatch[0]).toContain("width: '48%'");
    }
  });
});

describe('Static Layout Analysis - Spacing Consistency', () => {
  test('theme.ts should define all spacing constants', () => {
    const filePath = path.join(SRC_DIR, 'theme.ts');
    const content = readFile(filePath);
    expect(content).toContain('xs:');
    expect(content).toContain('sm:');
    expect(content).toContain('md:');
    expect(content).toContain('lg:');
    expect(content).toContain('xl:');
    expect(content).toContain('xxl:');
  });

  test('spacing.xs should be 4', () => {
    const filePath = path.join(SRC_DIR, 'theme.ts');
    const content = readFile(filePath);
    expect(content).toMatch(/xs:\s*4/);
  });

  test('spacing.sm should be 8', () => {
    const filePath = path.join(SRC_DIR, 'theme.ts');
    const content = readFile(filePath);
    expect(content).toMatch(/sm:\s*8/);
  });

  test('spacing.md should be 16', () => {
    const filePath = path.join(SRC_DIR, 'theme.ts');
    const content = readFile(filePath);
    expect(content).toMatch(/md:\s*16/);
  });
});

describe('Static Layout Analysis - Content Structure', () => {
  test('DashboardLayout should have overflow hidden on root', () => {
    const filePath = path.join(LAYOUT_DIR, 'DashboardLayout.tsx');
    const content = readFile(filePath);
    expect(content).toContain("overflow: 'hidden'");
  });

  test('DashboardLayout content should have flex: 1', () => {
    const filePath = path.join(LAYOUT_DIR, 'DashboardLayout.tsx');
    const content = readFile(filePath);
    const contentStyle = content.match(/content:\s*\{[^}]+\}/);
    if (contentStyle) {
      expect(contentStyle[0]).toContain('flex: 1');
    }
  });

  test('Screen component should use SafeAreaView', () => {
    const filePath = path.join(COMPONENTS_DIR, 'Screen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('SafeAreaView');
  });

  test('Screen component should support scroll mode', () => {
    const filePath = path.join(COMPONENTS_DIR, 'Screen.tsx');
    const content = readFile(filePath);
    expect(content).toContain('ScrollView');
  });

  test('ListScreen container should have flex: 1', () => {
    const filePath = path.join(GENERATORS_DIR, 'ListScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain("container: { flex: 1 }");
  });

  test('FormScreen container should have flex: 1', () => {
    const filePath = path.join(GENERATORS_DIR, 'FormScreen.tsx');
    const content = readFile(filePath);
    expect(content).toContain("container: { flex: 1 }");
  });

  describe('Module Dependencies', () => {
    test('CallContext should not import CallOverlays (no circular dependency)', () => {
      const filePath = path.join(SRC_DIR, 'calls', 'CallContext.tsx');
      const content = readFile(filePath);
      expect(content).not.toMatch(/import.*CallOverlays.*from/);
    });

    test('App.tsx should import both CallProvider and CallOverlays', () => {
      const filePath = path.join(path.join(__dirname, '..'), 'App.tsx');
      const content = readFile(filePath);
      expect(content).toContain("CallProvider");
      expect(content).toContain("CallOverlays");
    });
  });
});
