#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BRANCH="${DEPLOY_BRANCH:-gh-pages}"
REMOTE="${DEPLOY_REMOTE:-origin}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "当前目录不是 git 仓库，无法部署。" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "工作区存在未提交改动。请先提交或暂存后再部署。" >&2
  git status --short
  exit 1
fi

echo "开始构建..."
npm run build

if [ ! -f dist/index.html ]; then
  echo "构建失败：dist/index.html 不存在。" >&2
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
COMMIT_SHA="$(git rev-parse --short HEAD)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cp -R dist/. "$TMP_DIR/"
touch "$TMP_DIR/.nojekyll"

echo "准备发布到 ${REMOTE}/${BRANCH}..."

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git switch "$BRANCH"
else
  git switch --orphan "$BRANCH"
fi

git rm -rf . >/dev/null 2>&1 || true
cp -R "$TMP_DIR"/. .

git add -A

if git diff --cached --quiet; then
  echo "没有新的构建变更需要发布。"
else
  git commit -m "deploy: ${COMMIT_SHA}"
  git push "$REMOTE" "$BRANCH"
  echo "部署完成：${REMOTE}/${BRANCH}"
fi

git switch "$CURRENT_BRANCH"
