# Trinity System v2 - GitHub & Netlify デプロイガイド

## 📦 デプロイ対象

### Trinity Systemの構成
1. **GAS API** → Google Apps Script でホスト（Netlify不要）
2. **エージェント（Node.js）** → サーバー環境で実行（Netlify不要）
3. **ドキュメント（静的サイト）** → Netlify でホスティング可能 ✅

---

## 🐙 Part 1: GitHubへのデプロイ

### 1-1. GitHubリポジトリ作成

1. https://github.com/new にアクセス
2. リポジトリ名: `trinity-system-v2`
3. Description: `Trinity System v2 - イケメンの構造化（内面スコアリングシステム）`
4. Public / Private を選択
5. **Create repository**

### 1-2. ローカルからプッシュ

```bash
cd /root/clawd

# 初回コミット
git add .
git commit -m "Trinity System v2 - 初回コミット

- 2シート構成（users, events）
- 3エンドポイントAPI
- 3体のエージェント（Observer, Judge, Executor）
- 完全ドキュメント
- Netlify対応静的サイト"

# リモート追加
git remote add origin https://github.com/YOUR_USERNAME/trinity-system-v2.git

# プッシュ
git branch -M main
git push -u origin main
```

### 1-3. プッシュ完了確認

- [ ] GitHubリポジトリにアクセス
- [ ] ファイルが全て表示されることを確認
- [ ] README.md が自動表示されることを確認

---

## 🚀 Part 2: Netlifyへのデプロイ

### 2-1. Netlifyアカウント準備

1. https://www.netlify.com/ にアクセス
2. GitHub アカウントで Sign up / Log in

### 2-2. 新しいサイトをデプロイ

#### オプションA: GitHubから直接デプロイ（推奨）

1. Netlify ダッシュボードで **"Add new site"** → **"Import an existing project"**
2. **"Deploy with GitHub"** を選択
3. リポジトリ選択: `trinity-system-v2`
4. Build settings:
   - **Build command:** `echo 'Static site'`
   - **Publish directory:** `docs-site`
5. **Deploy site** をクリック

#### オプションB: 手動デプロイ

```bash
cd /root/clawd
cd docs-site
zip -r trinity-docs.zip .
```

1. Netlify ダッシュボードで **"Sites"** → **"Drag and drop"**
2. `trinity-docs.zip` をドラッグ&ドロップ

### 2-3. カスタムドメイン設定（オプション）

1. デプロイ完了後、**"Site settings"** → **"Domain management"**
2. **"Add custom domain"** でカスタムドメイン設定
3. DNS設定（Netlify DNS または外部DNS）

### 2-4. デプロイ完了確認

- [ ] Netlify URL（例: `https://trinity-system-v2.netlify.app`）にアクセス
- [ ] トップページが表示される
- [ ] ドキュメントリンクが機能する

---

## 📂 ディレクトリ構造（GitHub）

```
trinity-system-v2/
├── README.md                     # プロジェクトREADME
├── DEPLOYMENT-v2.md              # デプロイガイド
├── PROJECT_SUMMARY-v2.md         # 完成サマリー
├── VERSION_COMPARISON.md         # v1 vs v2 比較
├── GITHUB_NETLIFY_DEPLOY.md      # このファイル
├── .gitignore                    # Git無視ファイル
├── netlify.toml                  # Netlify設定
│
├── trinity-db-v2/                # データベース（CSV）
│   ├── users.csv
│   └── events.csv
│
├── gas-api-v2/                   # Google Apps Script API
│   ├── Code.gs
│   └── README.md
│
├── agents-v2/                    # 3体のエージェント
│   ├── observer.js
│   ├── judge.js
│   ├── executor.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── batch-v2/                     # バッチ処理
│   └── growth-calculator.js
│
└── docs-site/                    # Netlify用静的サイト
    ├── index.html
    └── README-v2.html
```

---

## 🔄 継続的デプロイ（GitHub → Netlify）

### 自動デプロイ設定（GitHubから）

1. Netlify で **"Site settings"** → **"Build & deploy"**
2. **"Continuous Deployment"** が有効になっていることを確認
3. 以降、`git push` するたびに自動デプロイされる

```bash
# 変更をコミット
git add .
git commit -m "Update documentation"
git push

# → Netlify が自動でデプロイ
```

---

## 🎯 デプロイ後の確認

### GitHub
- [ ] リポジトリが公開されている
- [ ] README.md が表示される
- [ ] 全ファイルがコミットされている

### Netlify
- [ ] サイトが正常に表示される
- [ ] ドキュメントリンクが機能する
- [ ] 自動デプロイが有効になっている

---

## 🔧 トラブルシューティング

### エラー: 'fatal: not a git repository'

```bash
cd /root/clawd
git init
git add .
git commit -m "Initial commit"
```

### エラー: 'Permission denied (publickey)'

GitHub の SSH キーを設定するか、HTTPS URLを使用：
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/trinity-system-v2.git
```

### Netlify: Build failed

`netlify.toml` の設定を確認：
```toml
[build]
  publish = "docs-site"
  command = "echo 'Static site'"
```

---

## 📊 デプロイ完了後

### 1. GAS APIを手動デプロイ
- `gas-api-v2/Code.gs` をGoogle Apps Scriptにコピー
- SPREADSHEET_ID を設定
- Web Appとしてデプロイ

### 2. エージェントを実行環境に配置
- サーバーまたはローカル環境で実行
- `.env` を設定
- Cronジョブを設定

### 3. ドキュメントを共有
- Netlify URL を社内で共有
- GitHubリポジトリをチームに公開

---

## ✅ デプロイ完了チェックリスト

- [ ] GitHubリポジトリ作成完了
- [ ] 全ファイルがプッシュされている
- [ ] Netlify サイトがデプロイされている
- [ ] Netlify URLが正常に表示される
- [ ] 自動デプロイが有効
- [ ] GAS API が手動デプロイされている
- [ ] エージェントが実行環境で動作している

---

**完璧に。GitHub & Netlify へデプロイ準備完了。**
