#!/bin/bash

set -e

CONFIG_FILE=".gitcli_config"
SNIPPET_CONFIG=".gitcli_snippets.json"

function auto_detect_repo_info() {
  if [ -d ".git" ]; then
    local remote_url=$(git remote get-url origin 2>/dev/null || echo "")
    if [[ -n "$remote_url" ]]; then
      # Remove .git suffix
      remote_url=${remote_url%.git}

      if [[ "$remote_url" =~ github\.com[:/]([^/]+)/(.+)$ ]]; then
        AUTO_PROVIDER="github"
        AUTO_REPO_OWNER="${BASH_REMATCH[1]}"
        AUTO_REPO_NAME="${BASH_REMATCH[2]}"
      elif [[ "$remote_url" =~ gitlab\.com[:/]([^/]+)/(.+)$ ]]; then
        AUTO_PROVIDER="gitlab"
        AUTO_REPO_OWNER="${BASH_REMATCH[1]}"
        AUTO_REPO_NAME="${BASH_REMATCH[2]}"
      fi
    fi
  fi
}

function configure_cli() {
  echo "Configuring Git CLI settings for current project..."

  auto_detect_repo_info

  if [[ -n "$AUTO_PROVIDER" ]]; then
    echo "Auto-detected: $AUTO_PROVIDER repository $AUTO_REPO_OWNER/$AUTO_REPO_NAME"
    read -p "Use auto-detected settings? (y/n): " use_auto
    if [[ "$use_auto" == "y" || "$use_auto" == "Y" ]]; then
      provider="$AUTO_PROVIDER"
      repo_owner="$AUTO_REPO_OWNER"
      repo_name="$AUTO_REPO_NAME"
    fi
  fi

  if [[ -z "$provider" ]]; then
    read -p "Enter Git provider (github/gitlab): " provider
  fi
  if [[ -z "$repo_owner" ]]; then
    read -p "Enter repository owner/organization: " repo_owner
  fi
  if [[ -z "$repo_name" ]]; then
    read -p "Enter repository name: " repo_name
  fi

  read -p "Enter your access token: " token
  read -p "Enter default target branch (e.g. main/master): " target_branch

  echo ""
  echo "PR Description Options:"
  read -p "Enter max commits to include in PR description (default: 10): " max_commits
  max_commits=${max_commits:-10}

  read -p "Group commits by type? (y/n, default: n): " group_commits
  group_commits=${group_commits:-n}

  # Get project/group IDs for API calls
  local project_id=""
  local group_id=""

  if [[ "$provider" == "gitlab" ]]; then
    echo "Fetching GitLab project ID..."
    project_id=$(get_gitlab_project_id "$repo_owner" "$repo_name" "$token")
    if [[ -n "$project_id" ]]; then
      echo "GitLab Project ID: $project_id"
    else
      echo "Warning: Could not fetch GitLab project ID. Will use owner/name fallback."
    fi
  elif [[ "$provider" == "github" ]]; then
    echo "Fetching GitHub repository ID..."
    project_id=$(get_github_repo_id "$repo_owner" "$repo_name" "$token")
    if [[ -n "$project_id" ]]; then
      echo "GitHub Repository ID: $project_id"
    else
      echo "Warning: Could not fetch GitHub repository ID. Will use owner/name fallback."
    fi
  fi

  cat > "$CONFIG_FILE" <<EOF
GIT_PROVIDER=$provider
GIT_TOKEN=$token
REPO_OWNER=$repo_owner
REPO_NAME=$repo_name
PROJECT_ID=$project_id
GROUP_ID=$group_id
TARGET_BRANCH=${target_branch:-main}
MAX_COMMITS=${max_commits}
GROUP_COMMITS=${group_commits}
EOF

  echo "Configuration saved to $CONFIG_FILE"
}

function get_gitlab_project_id() {
  local owner="$1"
  local name="$2"
  local token="$3"

  local encoded_path=$(printf "%s" "$owner/$name" | sed 's/\//%2F/g')
  local response=$(curl -s -H "PRIVATE-TOKEN: $token" \
    "https://gitlab.com/api/v4/projects/$encoded_path")

  echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

# JSON-escape helper – converts newlines to \n and escapes quotes & backslashes
json_escape() {
  local str="$1"
  # Escape backslashes first
  str="${str//\\/\\\\}"
  # Escape double quotes
  str="${str//\"/\\\"}"
  # Convert newlines and carriage returns to \n / \r literals
  str="${str//$'\r'/\\r}"
  str="${str//$'\n'/\\n}"
  echo "$str"
}

function create_github_pr() {
  local title="$1"
  local description="$2"
  local source_branch="$3"
  local target_branch="$4"

  # Escape values for safe JSON embedding
  local esc_title=$(json_escape "$title")
  local esc_description=$(json_escape "$description")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] GitHub PR Function parameters:"
    echo "[DEBUG] Title: '$title'"
    echo "[DEBUG] Description: '$description'"
    echo "[DEBUG] Source branch: '$source_branch'"
    echo "[DEBUG] Target branch: '$target_branch'"
    echo "[DEBUG] PROJECT_ID: '$PROJECT_ID'"
    echo "[DEBUG] REPO_OWNER: '$REPO_OWNER'"
    echo "[DEBUG] REPO_NAME: '$REPO_NAME'"
  fi

  # Use PROJECT_ID if available, fallback to owner/name
  local api_url
  if [[ -n "$PROJECT_ID" ]]; then
    api_url="https://api.github.com/repositories/$PROJECT_ID/pulls"
    [[ "$DEBUG" == "1" ]] && echo "[DEBUG] Using PROJECT_ID for API URL: $api_url"
  else
    api_url="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls"
    [[ "$DEBUG" == "1" ]] && echo "[DEBUG] Using owner/name for API URL: $api_url"
  fi

  local json_payload=$(cat <<EOF
{
  "title": "$esc_title",
  "body": "$esc_description",
  "head": "$source_branch",
  "base": "$target_branch"
}
EOF
)

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] JSON payload:"
    echo "$json_payload"
    echo "[DEBUG] API URL: $api_url"
    echo "[DEBUG] Token (first 10 chars): ${GIT_TOKEN:0:10}..."
  fi

  echo "Creating GitHub pull request..."
  local response=$(curl -s -X POST "$api_url" \
    -H "Authorization: token $GIT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$json_payload")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Full API response:"
    echo "$response"
    echo "[DEBUG] Response length: ${#response}"
  fi

  local pr_url=$(echo "$response" | grep -o '"html_url":"[^"]*' | cut -d'"' -f4)

  if [[ -n "$pr_url" ]]; then
    echo "Pull request created successfully: $pr_url"
  else
    echo "Error creating pull request:"
    echo "$response"
  fi
}

function get_github_repo_id() {
  local owner="$1"
  local name="$2"
  local token="$3"

  local response=$(curl -s -H "Authorization: token $token" \
    "https://api.github.com/repos/$owner/$name")

  echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

function load_token() {
  # Skip config loading for snippet commands that don't need git repo access
  if [[ "$1" == "snippet" ]]; then
    return 0
  fi

  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "No config file found. Starting initial setup..."
    configure_cli
  fi
  source "$CONFIG_FILE"
  if [[ -z "$GIT_TOKEN" || -z "$REPO_OWNER" || -z "$REPO_NAME" ]]; then
    echo "Error: GIT_TOKEN, REPO_OWNER, or REPO_NAME not set in config file"
    exit 1
  fi
  TARGET_BRANCH=${TARGET_BRANCH:-main}
  MAX_COMMITS=${MAX_COMMITS:-10}
  GROUP_COMMITS=${GROUP_COMMITS:-n}
}

function init_repo() {
  if [ ! -d ".git" ]; then
    git init
    if [[ "$GIT_PROVIDER" == "github" ]]; then
      git remote add origin "https://github.com/$REPO_OWNER/$REPO_NAME.git"
    elif [[ "$GIT_PROVIDER" == "gitlab" ]]; then
      git remote add origin "https://gitlab.com/$REPO_OWNER/$REPO_NAME.git"
    fi
    echo "Initialized Git repository and set remote."
  else
    echo "Git repository already initialized."
  fi
}

function commit_all() {
  git add .
  git commit -m "$1"
  echo "Committed all changes with message: $1"
}

function create_branch() {
  git checkout -b "$1"
  echo "Created and switched to branch: $1"
}

function push_branch() {
  if [[ "$GIT_PROVIDER" == "github" ]]; then
    git push -u "https://${GIT_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git" "$1"
  elif [[ "$GIT_PROVIDER" == "gitlab" ]]; then
    git push -u "https://${GIT_TOKEN}@gitlab.com/${REPO_OWNER}/${REPO_NAME}.git" "$1"
  fi
  echo "Pushed branch $1 to remote."
}

function bump_version() {
  git tag "$1"
  if [[ "$GIT_PROVIDER" == "github" ]]; then
    git push "https://${GIT_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git" --tags
  elif [[ "$GIT_PROVIDER" == "gitlab" ]]; then
    git push "https://${GIT_TOKEN}@gitlab.com/${REPO_OWNER}/${REPO_NAME}.git" --tags
  fi
  echo "Version bumped to $1 and pushed tag."
}

function get_commits_since_last_merge() {
  # Find the last merge commit
  last_merge=$(git log --merges --oneline -n 1 --format="%H" 2>/dev/null || echo "")

  if [[ -z "$last_merge" ]]; then
    # No merge commits found, get all commits from first commit
    git log --oneline --format="%s" --reverse
  else
    # Get commits since the last merge
    git log --oneline --format="%s" "${last_merge}..HEAD" --reverse
  fi
}

function format_commit_messages() {
  local commit_messages="$1"
  local max_commits="${MAX_COMMITS:-10}"
  local group_commits="${GROUP_COMMITS:-n}"

  if [[ -z "$commit_messages" ]]; then
    echo "No commits found since last merge"
    return
  fi

  # Limit number of commits
  local limited_commits=$(echo "$commit_messages" | head -n "$max_commits")

  if [[ "$group_commits" == "y" || "$group_commits" == "Y" ]]; then
    # Group commits by type
    local feat_commits=$(echo "$limited_commits" | grep -i "^feat" || true)
    local fix_commits=$(echo "$limited_commits" | grep -i "^fix" || true)
    local docs_commits=$(echo "$limited_commits" | grep -i "^docs" || true)
    local style_commits=$(echo "$limited_commits" | grep -i "^style" || true)
    local refactor_commits=$(echo "$limited_commits" | grep -i "^refactor" || true)
    local test_commits=$(echo "$limited_commits" | grep -i "^test" || true)
    local chore_commits=$(echo "$limited_commits" | grep -i "^chore" || true)
    local other_commits=$(echo "$limited_commits" | grep -iv "^feat\|^fix\|^docs\|^style\|^refactor\|^test\|^chore" || true)

    local result=""

    # Helper function to add group if it has commits
    add_group_if_not_empty() {
      local group_name="$1"
      local group_emoji="$2"
      local group_commits="$3"

      if [[ -n "$group_commits" && $(echo "$group_commits" | grep -c .) -gt 0 ]]; then
        result+="### $group_emoji $group_name"$'\n'
        while IFS= read -r line; do
          [[ -n "$line" ]] && result+="- $line"$'\n'
        done <<< "$group_commits"
        result+=$'\n'
      fi
    }

    # Add groups only if they have commits
    add_group_if_not_empty "Features" "✨" "$feat_commits"
    add_group_if_not_empty "Bug Fixes" "🐛" "$fix_commits"
    add_group_if_not_empty "Documentation" "📚" "$docs_commits"
    add_group_if_not_empty "Refactoring" "♻️" "$refactor_commits"
    add_group_if_not_empty "Tests" "🧪" "$test_commits"
    add_group_if_not_empty "Chores" "🔧" "$chore_commits"
    add_group_if_not_empty "Other Changes" "📝" "$other_commits"

    echo "$result"
  else
    # Simple list format
    echo "$limited_commits" | while IFS= read -r line; do
      [[ -n "$line" ]] && echo "- $line"
    done
  fi

  # Add note if commits were truncated
  local total_commits=$(echo "$commit_messages" | wc -l)
  if [[ $total_commits -gt $max_commits ]]; then
    echo ""
    echo "_... and $((total_commits - max_commits)) more commits_"
  fi
}

function validate_branch_has_new_commits() {
  local target_branch="${1:-$TARGET_BRANCH}"
  local current_branch=$(git branch --show-current)

  if [[ "$current_branch" == "$target_branch" ]]; then
    echo "Error: You are on the target branch '$target_branch'. Please create a feature branch first."
    return 1
  fi

  # Check if target branch exists locally
  if ! git show-ref --verify --quiet "refs/heads/$target_branch"; then
    echo "Warning: Target branch '$target_branch' does not exist locally."
    echo "Attempting to fetch from remote..."

    # Try to fetch the target branch
    if git fetch origin "$target_branch:$target_branch" 2>/dev/null; then
      echo "Successfully fetched '$target_branch' from remote."
    else
      echo "Error: Could not fetch target branch '$target_branch' from remote."
      echo "Please ensure the target branch exists and you have access to the repository."
      return 1
    fi
  fi

  # Update target branch from remote to get latest changes
  echo "Updating target branch '$target_branch' from remote..."
  git fetch origin "$target_branch" 2>/dev/null || echo "Warning: Could not update target branch from remote."

  # Check if current branch has commits ahead of target branch
  local commits_ahead=$(git rev-list --count "$target_branch..$current_branch" 2>/dev/null || echo "0")

  if [[ "$commits_ahead" == "0" ]]; then
    echo "Error: Current branch '$current_branch' has no new commits compared to '$target_branch'."
    echo "Please make some commits before creating a pull request."
    return 1
  fi

  echo "✓ Branch '$current_branch' has $commits_ahead new commit(s) compared to '$target_branch'."
  return 0
}

function extract_repo_info() {
  # Repository info is already loaded from config
  echo "Using repository: $REPO_OWNER/$REPO_NAME"
}

function create_pull_request() {
  local pr_title="$1"
  local target_branch="${2:-$TARGET_BRANCH}"
  local current_branch=$(git branch --show-current)

  if [[ -z "$pr_title" ]]; then
    read -p "Enter pull request title: " pr_title
  fi

  if [[ -z "$pr_title" ]]; then
    echo "Error: Pull request title cannot be empty"
    exit 1
  fi

  # Validate branch has new commits
  echo "Validating branch for pull request..."
  if ! validate_branch_has_new_commits "$target_branch"; then
    exit 1
  fi

  # Get commit messages for description
  local commit_messages=$(get_commits_since_last_merge)
  local pr_description=$(format_commit_messages "$commit_messages")

  extract_repo_info

  if [[ "$GIT_PROVIDER" == "github" ]]; then
    create_github_pr "$pr_title" "$pr_description" "$current_branch" "$target_branch"
  elif [[ "$GIT_PROVIDER" == "gitlab" ]]; then
    create_gitlab_pr "$pr_title" "$pr_description" "$current_branch" "$target_branch"
  else
    echo "Error: Unsupported provider: $GIT_PROVIDER"
    exit 1
  fi
}

function push_and_create_pull_request() {
  local pr_title="$1"
  local target_branch="${2:-$TARGET_BRANCH}"
  local current_branch=$(git branch --show-current)

  if [[ -z "$pr_title" ]]; then
    read -p "Enter pull request title: " pr_title
  fi

  if [[ -z "$pr_title" ]]; then
    echo "Error: Pull request title cannot be empty"
    exit 1
  fi

  # First, push the current branch to remote
  echo "Pushing branch '$current_branch' to remote..."

  # Check if we can push to the current remote (SSH or HTTPS)
  if git push -u origin "$current_branch" 2>/dev/null; then
    echo "Successfully pushed using existing remote configuration."
  else
    # Fallback to using token-based HTTPS push
    echo "Existing remote failed, trying with token-based HTTPS..."
    if [[ "$GIT_PROVIDER" == "github" ]]; then
      git push -u "https://${GIT_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git" "$current_branch"
    elif [[ "$GIT_PROVIDER" == "gitlab" ]]; then
      git push -u "https://${GIT_TOKEN}@gitlab.com/${REPO_OWNER}/${REPO_NAME}.git" "$current_branch"
    else
      echo "Error: Unsupported provider: $GIT_PROVIDER"
      exit 1
    fi
  fi

  if [[ $? -eq 0 ]]; then
    echo "Successfully pushed branch '$current_branch' to remote."
    echo ""

    # Validate branch has new commits before creating PR
    echo "Validating branch for pull request..."
    if ! validate_branch_has_new_commits "$target_branch"; then
      exit 1
    fi

    # Now create the pull request (skip validation as we already did it)
    echo "Creating pull request..."

    # Get commit messages for description
    local commit_messages=$(get_commits_since_last_merge)
    local pr_description=$(format_commit_messages "$commit_messages")

    extract_repo_info

    if [[ "$GIT_PROVIDER" == "github" ]]; then
      create_github_pr "$pr_title" "$pr_description" "$current_branch" "$target_branch"
    elif [[ "$GIT_PROVIDER" == "gitlab" ]]; then
      create_gitlab_pr "$pr_title" "$pr_description" "$current_branch" "$target_branch"
    else
      echo "Error: Unsupported provider: $GIT_PROVIDER"
      exit 1
    fi
  else
    echo "Error: Failed to push branch '$current_branch' to remote."
    exit 1
  fi
}


function get_github_pr_for_branch() {
  local branch="$1"

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Getting GitHub PR for branch: $branch"
  fi

  # Use PROJECT_ID if available, fallback to owner/name
  local api_url
  if [[ -n "$PROJECT_ID" ]]; then
    api_url="https://api.github.com/repositories/$PROJECT_ID/pulls"
  else
    api_url="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls"
  fi

  local response=$(curl -s "$api_url?head=$REPO_OWNER:$branch&state=open" \
    -H "Authorization: token $GIT_TOKEN")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] GitHub PR API response: $response"
  fi

  # Extract PR number from response
  echo "$response" | grep -o '"number":[0-9]*' | head -1 | cut -d':' -f2
}

function update_github_pr() {
  local pr_number="$1"
  local description="$2"

  if [[ -z "$pr_number" ]]; then
    echo "Error: PR number not provided"
    return 1
  fi

  # Escape description for JSON
  local esc_description=$(json_escape "$description")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Updating GitHub PR #$pr_number"
    echo "[DEBUG] New description: $description"
  fi

  # Use PROJECT_ID if available, fallback to owner/name
  local api_url
  if [[ -n "$PROJECT_ID" ]]; then
    api_url="https://api.github.com/repositories/$PROJECT_ID/pulls/$pr_number"
  else
    api_url="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$pr_number"
  fi

  local json_payload=$(cat <<EOF
{
  "body": "$esc_description"
}
EOF
)

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] JSON payload: $json_payload"
    echo "[DEBUG] API URL: $api_url"
  fi

  echo "Updating GitHub pull request #$pr_number..."
  local response=$(curl -s -X PATCH "$api_url" \
    -H "Authorization: token $GIT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$json_payload")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Update response: $response"
  fi

  local pr_url=$(echo "$response" | grep -o '"html_url":"[^"]*' | cut -d'"' -f4)

  if [[ -n "$pr_url" ]]; then
    echo "Pull request updated successfully: $pr_url"
  else
    echo "Error updating pull request:"
    echo "$response"
  fi
}

function get_gitlab_mr_for_branch() {
  local branch="$1"

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Getting GitLab MR for branch: $branch"
  fi

  # Use PROJECT_ID if available, fallback to dynamic lookup
  local project_id="$PROJECT_ID"
  if [[ -z "$project_id" ]]; then
    project_id=$(get_gitlab_project_id "$REPO_OWNER" "$REPO_NAME" "$GIT_TOKEN")
  fi

  if [[ -z "$project_id" ]]; then
    echo "Error: Could not determine GitLab project ID"
    return 1
  fi

  local api_url="https://gitlab.com/api/v4/projects/$project_id/merge_requests?source_branch=$branch&state=opened"

  local response=$(curl -s "$api_url" \
    -H "PRIVATE-TOKEN: $GIT_TOKEN")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] GitLab MR API response: $response"
  fi

  # Extract MR IID from response
  echo "$response" | grep -o '"iid":[0-9]*' | head -1 | cut -d':' -f2
}

function update_gitlab_mr() {
  local mr_iid="$1"
  local description="$2"

  if [[ -z "$mr_iid" ]]; then
    echo "Error: MR IID not provided"
    return 1
  fi

  # Escape description for JSON
  local esc_description=$(json_escape "$description")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Updating GitLab MR !$mr_iid"
    echo "[DEBUG] New description: $description"
  fi

  # Use PROJECT_ID if available, fallback to dynamic lookup
  local project_id="$PROJECT_ID"
  if [[ -z "$project_id" ]]; then
    project_id=$(get_gitlab_project_id "$REPO_OWNER" "$REPO_NAME" "$GIT_TOKEN")
  fi

  if [[ -z "$project_id" ]]; then
    echo "Error: Could not determine GitLab project ID"
    return 1
  fi

  local api_url="https://gitlab.com/api/v4/projects/$project_id/merge_requests/$mr_iid"

  local json_payload=$(cat <<EOF
{
  "description": "$esc_description"
}
EOF
)

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] JSON payload: $json_payload"
    echo "[DEBUG] API URL: $api_url"
  fi

  echo "Updating GitLab merge request !$mr_iid..."

  # Create a temporary file to store the JSON payload
  local temp_payload=$(mktemp)
  echo "$json_payload" > "$temp_payload"

  local response=$(curl -s -X PUT "$api_url" \
    -H "PRIVATE-TOKEN: $GIT_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$temp_payload" \
    --write-out "\nHTTP_STATUS:%{http_code}\n")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Update response: $response"
  fi

  # Clean up temp file
  rm -f "$temp_payload"

  # Extract HTTP status code
  local http_status=$(echo "$response" | tail -1 | grep "HTTP_STATUS:" | cut -d':' -f2)
  local response_body=$(echo "$response" | head -n -1)

  if [[ "$http_status" == "200" ]]; then
    # Success - extract URL from response (get the last web_url which should be the MR URL)
    local mr_url=$(echo "$response_body" | grep -o '"web_url":"[^"]*' | tail -1 | cut -d'"' -f4)
    if [[ -n "$mr_url" ]]; then
      echo "Merge request updated successfully: $mr_url"
    else
      echo "Merge request updated successfully!"
    fi
  else
    echo "Error updating merge request (HTTP $http_status):"
    echo "$response_body"
  fi
}

function update_pull_request() {
  local current_branch=$(git branch --show-current)

  echo "Updating pull request for branch '$current_branch'..."

  # Get commit messages for description
  local commit_messages=$(get_commits_since_last_merge)
  local pr_description=$(format_commit_messages "$commit_messages")

  extract_repo_info

  if [[ "$GIT_PROVIDER" == "github" ]]; then
    local pr_number=$(get_github_pr_for_branch "$current_branch")
    if [[ -n "$pr_number" ]]; then
      update_github_pr "$pr_number" "$pr_description"
    else
      echo "Error: No open pull request found for branch '$current_branch'"
      exit 1
    fi
  elif [[ "$GIT_PROVIDER" == "gitlab" ]]; then
    local mr_iid=$(get_gitlab_mr_for_branch "$current_branch")
    if [[ -n "$mr_iid" ]]; then
      update_gitlab_mr "$mr_iid" "$pr_description"
    else
      echo "Error: No open merge request found for branch '$current_branch'"
      exit 1
    fi
  else
    echo "Error: Unsupported provider: $GIT_PROVIDER"
    exit 1
  fi
}

function create_gitlab_pr() {
  local title="$1"
  local description="$2"
  local source_branch="$3"
  local target_branch="$4"

  # Escape values for safe JSON embedding
  local esc_title=$(json_escape "$title")
  local esc_description=$(json_escape "$description")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Function parameters:"
    echo "[DEBUG] Title: '$title'"
    echo "[DEBUG] Description: '$description'"
    echo "[DEBUG] Source branch: '$source_branch'"
    echo "[DEBUG] Target branch: '$target_branch'"
    echo "[DEBUG] PROJECT_ID: '$PROJECT_ID'"
    echo "[DEBUG] REPO_OWNER: '$REPO_OWNER'"
    echo "[DEBUG] REPO_NAME: '$REPO_NAME'"
  fi

  # Use PROJECT_ID if available, fallback to owner/name
  local api_url
  if [[ -n "$PROJECT_ID" ]]; then
    api_url="https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests"
    [[ "$DEBUG" == "1" ]] && echo "[DEBUG] Using PROJECT_ID for API URL: $api_url"
  else
    # Get project ID dynamically as fallback
    [[ "$DEBUG" == "1" ]] && echo "[DEBUG] PROJECT_ID not set, fetching dynamically..."
    local project_id=$(get_gitlab_project_id "$REPO_OWNER" "$REPO_NAME" "$GIT_TOKEN")
    if [[ -n "$project_id" ]]; then
      api_url="https://gitlab.com/api/v4/projects/$project_id/merge_requests"
      [[ "$DEBUG" == "1" ]] && echo "[DEBUG] Fetched project ID: $project_id"
      [[ "$DEBUG" == "1" ]] && echo "[DEBUG] Using dynamic project ID for API URL: $api_url"
    else
      echo "Error: Could not determine GitLab project ID"
      return 1
    fi
  fi

  local json_payload=$(cat <<EOF
{
  "title": "$esc_title",
  "description": "$esc_description",
  "source_branch": "$source_branch",
  "target_branch": "$target_branch"
}
EOF
)

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] JSON payload:"
    echo "$json_payload"
    echo "[DEBUG] API URL: $api_url"
    echo "[DEBUG] Token (first 10 chars): ${GIT_TOKEN:0:10}..."
  fi

  echo "Creating GitLab merge request..."

  # Create a temporary file to store the JSON payload
  local temp_payload=$(mktemp)
  echo "$json_payload" > "$temp_payload"

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] About to execute curl command:"
    echo "curl -s -X POST '$api_url' \\"
    echo "  -H 'PRIVATE-TOKEN: $GIT_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d @$temp_payload"
  fi

  # Execute curl with verbose output to a temp file
  local temp_verbose=$(mktemp)
  local response=$(curl -s -X POST "$api_url" \
    -H "PRIVATE-TOKEN: $GIT_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$temp_payload" \
    --write-out "\nHTTP_STATUS:%{http_code}\n" \
    2>"$temp_verbose")

  if [[ "$DEBUG" == "1" ]]; then
    echo "[DEBUG] Curl stderr output:"
    cat "$temp_verbose"
    echo "[DEBUG] Full API response:"
    echo "$response"
    echo "[DEBUG] Response length: ${#response}"
  fi

  # Clean up temp files
  rm -f "$temp_payload" "$temp_verbose"

  # Extract HTTP status code
  local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
  local response_body=$(echo "$response" | grep -v "HTTP_STATUS:")

  [[ "$DEBUG" == "1" ]] && echo "[DEBUG] HTTP Status: $http_status"

  if [[ "$http_status" == "201" ]]; then
    # Success - extract URL from response
    local mr_url=$(echo "$response_body" | grep -o '"web_url":"[^"]*' | cut -d'"' -f4)
    echo "Merge request created successfully: $mr_url"
  elif [[ "$http_status" == "409" ]]; then
    # Conflict - likely duplicate merge request
    echo "Error: A merge request already exists for this source branch."
    echo "Details: $response_body"
  elif [[ "$http_status" == "400" ]]; then
    # Bad request - show detailed error
    echo "Error: Bad request - check your parameters."
    echo "Details: $response_body"
  elif [[ "$http_status" == "401" ]]; then
    # Unauthorized - token issue
    echo "Error: Unauthorized - check your GitLab token permissions."
    echo "Details: $response_body"
  else
    # Other errors
    echo "Error creating merge request (HTTP $http_status):"
    echo "$response_body"
  fi
}

function print_help() {
  echo "Git Automation CLI with Snippet Management"
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Git Commands:"
  echo "  config                Set up Git CLI credentials and PR options"
  echo "  init                  Initialize git repo and set remote"
  echo "  commit <message>      Commit all with a message"
  echo "  branch <name>         Create and switch to a new branch"
  echo "  push <branch>         Push current branch to remote"
  echo "  bump <version>        Tag a new version and push"
  echo "  pr [title] [target]   Create pull request (title optional, target defaults to configured branch)"
  echo "  ppr [title] [target]  Push current branch to remote and create pull request"
  echo "  upr                   Update existing pull request description with latest commits"
  echo ""
  echo "Snippet Commands:"
  echo "  snippet list          List all configured snippets"
  echo "  snippet add <alias> <command>   Add a new snippet alias"
  echo "  snippet remove <alias>          Remove a snippet alias"
  echo "  snippet run <alias>             Execute a snippet by alias"
  echo ""
  echo "Configuration Options (set via 'config' command):"
  echo "  MAX_COMMITS           Maximum number of commits to include in PR description (default: 10)"
  echo "  GROUP_COMMITS         Group commits by type in PR description (y/n, default: n)"
  echo "                        Supported types: feat, fix, docs, style, refactor, test, chore"
  echo ""
  echo "Environment Variables:"
  echo "  DEBUG=1               Enable debug output for troubleshooting"
  echo ""
  echo "Git Examples:"
  echo "  $0 config             Set up credentials and PR description options"
  echo "  $0 pr \"My feature\"      Create PR with title 'My feature'"
  echo "  $0 ppr \"New feature\"    Push branch and create PR"
  echo "  $0 upr                Update existing PR description with latest commits"
  echo "  DEBUG=1 $0 ppr \"Test\"   Push branch and create PR with debug output"
  echo ""
  echo "Snippet Examples:"
  echo "  $0 snippet add gst \"git status\"                   Add git status alias"
  echo "  $0 snippet add gco \"git checkout\"                Add git checkout alias"
  echo "  $0 snippet add deploy \"npm run build && npm run deploy\"  Add multi-command snippet"
  echo "  $0 snippet list                                    List all snippets"
  echo "  $0 snippet run gst                                 Run git status via snippet"
  echo "  $0 snippet remove gst                              Remove the gst snippet"
  echo ""
  echo "PR Description Features:"
  echo "  - Automatically includes commit messages since last merge"
  echo "  - Limits number of commits based on MAX_COMMITS setting"
  echo "  - Can group commits by conventional commit types (feat:, fix:, etc.)"
  echo "  - Shows truncation note if more commits exist than limit"
  echo "  - Only displays commit groups that contain commits"
  echo ""
  echo "Pull Request Validation:"
  echo "  - Validates current branch has new commits vs target branch"
  echo "  - Prevents creating PR from target branch itself"
  echo "  - Auto-fetches latest target branch for accurate comparison"
  echo "  - Shows commit count ahead of target branch"
}

# Load config before executing any command
if [[ "$1" == "config" ]]; then
  configure_cli
  exit 0
fi

# Load config (skip for snippet commands)
load_token "$1"

function snippet_list() {
  if [[ ! -f "$SNIPPET_CONFIG" ]]; then
    echo "No snippets configured."
    return
  fi
  echo "Configured snippets:"
  jq -r '.aliases | to_entries[] | "[32m" + .key + "[0m -> " + .value' "$SNIPPET_CONFIG"
}

function snippet_add() {
  local alias="$1"
  shift
  local command="$@"
  if [[ -z "$alias" || -z "$command" ]]; then
    echo "Usage: $0 snippet add <alias> <command>"
    return
  fi
  if [[ ! -f "$SNIPPET_CONFIG" ]]; then
    echo '{"aliases":{}}' > "$SNIPPET_CONFIG"
  fi
  jq -n --arg alias "$alias" --arg command "$command" 'input | .aliases[$alias]=$command' "$SNIPPET_CONFIG" > tmp.$$.json && mv tmp.$$.json "$SNIPPET_CONFIG"
  echo "Snippet added: $alias -> $command"
}

function snippet_remove() {
  local alias="$1"
  if [[ -z "$alias" ]]; then
    echo "Usage: $0 snippet remove <alias>"
    return
  fi
  if [[ ! -f "$SNIPPET_CONFIG" ]]; then
    echo "No snippets configured."
    return
  fi
  jq -n --arg alias "$alias" 'input | del(.aliases[$alias])' "$SNIPPET_CONFIG" > tmp.$$.json && mv tmp.$$.json "$SNIPPET_CONFIG"
  echo "Snippet removed: $alias"
}

function snippet_run() {
  local alias="$1"
  if [[ -z "$alias" ]]; then
    echo "Usage: $0 snippet run <alias>"
    return
  fi
  if [[ ! -f "$SNIPPET_CONFIG" ]]; then
    echo "No snippets configured."
    return
  fi
  local command=$(jq -r --arg alias "$alias" '.aliases[$alias] // empty' "$SNIPPET_CONFIG")
  if [[ -n "$command" ]]; then
    eval "$command"
  else
    echo "Snippet not found: $alias"
  fi
}
case "$1" in
  init)
    init_repo
    ;;
  commit)
    shift
    commit_all "$@"
    ;;
  branch)
    shift
    create_branch "$@"
    ;;
  push)
    shift
    push_branch "$@"
    ;;
  bump)
    shift
    bump_version "$@"
    ;;
  pr)
    shift
    create_pull_request "$@"
    ;;
  ppr)
    shift
    push_and_create_pull_request "$@"
    ;;
  upr)
    shift
    update_pull_request "$@"
    ;;
  snippet)
    case "$2" in
      list)
        snippet_list
        ;;
      add)
        shift 2
        snippet_add "$@"
        ;;
      remove)
        shift 2
        snippet_remove "$@"
        ;;
      run)
        shift 2
        snippet_run "$@"
        ;;
      *)
        echo "Usage: $0 snippet [list|add|remove|run] [options]"
        echo "Run '$0' for full help."
        ;;
    esac
    ;;
  *)
    print_help
    ;;
esac
