import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let statusBarItem2: vscode.StatusBarItem;

// let buttonRange: vscode.Range | undefined; // 按钮所在的Range
// let allSelections: vscode.Selection[] = [];

const batchReplace = (type?: '{') => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const selections = editor.selections;
  // console.log(selections);

  // 🔥 关键：只调用一次 editor.edit()，在里面批量处理所有选区
  editor.edit((editBuilder) => {
    selections.forEach((selection) => {
      const selectedText = editor.document.getText(selection);
      if (selectedText) {
        editBuilder.replace(selection, replaceStr(selectedText, type));
      }
    });
  });
};

const replaceStr = (str: string, type?: '{'): string => {
  let s = str;

  if (!['"', "'", '`'].includes(s[0])) {
    s = `'${s}`;
  }
  if (!['"', "'", '`'].includes(s[s.length - 1])) {
    s = `${s}'`;
  }

  return type === '{' ? `{t(${s})}` : `t(${s})`;
};

// 激活插件时的入口
export function activate(context: vscode.ExtensionContext) {
  // ========== 1. 创建状态栏项 ==========
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = 't()';
  statusBarItem.command = 'i18n-string-replace.replace';
  // statusBarItem.show();

  statusBarItem2 = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem2.text = '{t()}';
  statusBarItem2.command = 'i18n-string-replace.replace2';
  // statusBarItem2.show();
  // ========== 3. 显示状态栏 ==========

  // 2. 注册按钮点击命令（你的自定义逻辑）
  let disposable = vscode.commands.registerCommand('i18n-string-replace.replace', () => {
    batchReplace();
  });

  // 2. 注册按钮点击命令（你的自定义逻辑）
  let disposable2 = vscode.commands.registerCommand('i18n-string-replace.replace2', () => {
    batchReplace('{');
  });

  // 3. 监听选中变化 → 显示/隐藏浮动按钮
  // vscode.window.onDidChangeTextEditorSelection((e) => {
  //   const editor = e.textEditor;
  //   const selections = editor.selections;
  //   buttonRange = undefined; // 重置按钮位置

  //   if (selections.length === 1 && !selections[0].isEmpty) {
  //     buttonRange = new vscode.Range(selections[0].end, selections[0].end);
  //   }
  // });

  const hoverProvider = vscode.languages.registerHoverProvider(
    ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    {
      provideHover(document: vscode.TextDocument, position: vscode.Position) {
        // 2. 获取编辑器选中区域
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return undefined; // 无打开的编辑器
        }

        const selections = editor.selections;

        // 判断：是否有选中的文本（不是空选区）
        if (selections.length == 0) {
          return undefined;
        }
        // 判断第一个不能为空
        if (selections[0].isEmpty) {
          return undefined;
        }

        const isPositionInSelection = selections.findIndex((el) => el.contains(position));
        // 不在选中范围内 → 不显示提示
        if (isPositionInSelection == -1) {
          return;
        }

        // 3. 获取选中的文本内容
        // const selectedText = document.getText(selection);

        // 4. 构造【Markdown 格式】的提示内容（支持所有 MD 语法）
        const markdownText = new vscode.MarkdownString('', true);
        markdownText.isTrusted = true;
        markdownText.appendMarkdown(`i18n 替换文本 ${selections.length} 个\n\n`);
        markdownText.appendMarkdown('--- \n\n');
        markdownText.appendMarkdown(`- [替换成 t(selection)](command:i18n-string-replace.replace)\n\n`);
        markdownText.appendMarkdown(`- [替换成 {t(selection)}](command:i18n-string-replace.replace2)\n\n`);

        // 允许 Markdown 解析（必须开启）
        markdownText.isTrusted = true;

        // 5. 返回悬停对象（在选中位置显示）
        return new vscode.Hover(markdownText);
      },
    },
  );

  context.subscriptions.push(disposable, disposable2, hoverProvider);
}

export function deactivate() {}
