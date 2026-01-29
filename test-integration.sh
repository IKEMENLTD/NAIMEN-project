#!/bin/bash
# Trinity System - 統合テストスクリプト

echo "==================================="
echo "Trinity System - 統合テスト"
echo "==================================="
echo ""

# 色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト結果カウンター
PASSED=0
FAILED=0

# テスト関数
test_step() {
    echo -n "[$1] $2 ... "
}

pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}"
    if [ ! -z "$1" ]; then
        echo "   エラー: $1"
    fi
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC}"
    if [ ! -z "$1" ]; then
        echo "   警告: $1"
    fi
}

echo "1. ディレクトリ構造の確認"
echo "-----------------------------------"

test_step "1.1" "trinity-db/ ディレクトリ"
if [ -d "trinity-db" ]; then
    pass
else
    fail "ディレクトリが見つかりません"
fi

test_step "1.2" "gas-api/ ディレクトリ"
if [ -d "gas-api" ]; then
    pass
else
    fail "ディレクトリが見つかりません"
fi

test_step "1.3" "agents/ ディレクトリ"
if [ -d "agents" ]; then
    pass
else
    fail "ディレクトリが見つかりません"
fi

test_step "1.4" "batch/ ディレクトリ"
if [ -d "batch" ]; then
    pass
else
    fail "ディレクトリが見つかりません"
fi

echo ""
echo "2. CSVファイルの確認"
echo "-----------------------------------"

CSV_FILES=("users.csv" "trinity_scores.csv" "observations.csv" "judgments.csv" "executions.csv" "agents.csv" "growth_tracking.csv")

for csv in "${CSV_FILES[@]}"; do
    test_step "2.x" "$csv"
    if [ -f "trinity-db/$csv" ]; then
        pass
    else
        fail "ファイルが見つかりません"
    fi
done

echo ""
echo "3. GAS APIファイルの確認"
echo "-----------------------------------"

test_step "3.1" "Code.gs"
if [ -f "gas-api/Code.gs" ]; then
    pass
else
    fail "ファイルが見つかりません"
fi

echo ""
echo "4. エージェントファイルの確認"
echo "-----------------------------------"

test_step "4.1" "observer.js"
if [ -f "agents/observer.js" ]; then
    pass
else
    fail "ファイルが見つかりません"
fi

test_step "4.2" "judge.js"
if [ -f "agents/judge.js" ]; then
    pass
else
    fail "ファイルが見つかりません"
fi

test_step "4.3" "executor.js"
if [ -f "agents/executor.js" ]; then
    pass
else
    fail "ファイルが見つかりません"
fi

test_step "4.4" "package.json"
if [ -f "agents/package.json" ]; then
    pass
else
    fail "ファイルが見つかりません"
fi

echo ""
echo "5. 環境変数の確認"
echo "-----------------------------------"

test_step "5.1" ".env.example が存在"
if [ -f "agents/.env.example" ]; then
    pass
else
    fail "ファイルが見つかりません"
fi

test_step "5.2" ".env が存在"
if [ -f "agents/.env" ]; then
    pass
    
    # .envの内容をチェック
    if grep -q "YOUR_" "agents/.env"; then
        warn "環境変数が未設定です（YOUR_が含まれています）"
    fi
else
    warn ".env ファイルが作成されていません"
fi

echo ""
echo "6. Node.jsの確認"
echo "-----------------------------------"

test_step "6.1" "Node.js インストール"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ PASS${NC} ($NODE_VERSION)"
    ((PASSED++))
else
    fail "Node.jsがインストールされていません"
fi

echo ""
echo "7. ドキュメントの確認"
echo "-----------------------------------"

DOCS=("README.md" "DEPLOYMENT.md" "agents/README.md" "agents/AGENTS.md" "agents/CRON.md")

for doc in "${DOCS[@]}"; do
    test_step "7.x" "$doc"
    if [ -f "$doc" ]; then
        pass
    else
        fail "ファイルが見つかりません"
    fi
done

echo ""
echo "8. バッチスクリプトの確認"
echo "-----------------------------------"

test_step "8.1" "growth-calculator.js"
if [ -f "batch/growth-calculator.js" ]; then
    pass
else
    fail "ファイルが見つかりません"
fi

echo ""
echo "==================================="
echo "テスト結果サマリー"
echo "==================================="
echo -e "成功: ${GREEN}$PASSED${NC}"
echo -e "失敗: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ すべてのテストが成功しました！${NC}"
    echo ""
    echo "次のステップ:"
    echo "1. Googleスプレッドシートを作成"
    echo "2. CSVファイルをインポート"
    echo "3. GAS APIをデプロイ"
    echo "4. agents/.env を設定"
    echo "5. npm run test で動作確認"
    echo ""
    echo "詳細: DEPLOYMENT.md を参照"
    exit 0
else
    echo -e "${RED}✗ テストに失敗しました${NC}"
    echo "上記のエラーを修正してから再実行してください。"
    exit 1
fi
