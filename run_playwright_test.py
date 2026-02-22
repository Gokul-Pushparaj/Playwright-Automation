name: Enterprise Playwright Automation

on:
  push:
    paths:
      - 'testscripts/*.spec.ts'

permissions:
  contents: write
  pages: write
  id-token: write

jobs:

  test:

    runs-on: ubuntu-latest

    steps:

    # -------------------------------------------------
    # Checkout repository
    # -------------------------------------------------
    - name: Checkout repository
      uses: actions/checkout@v4


    # -------------------------------------------------
    # Setup Node
    # -------------------------------------------------
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: 20


    # -------------------------------------------------
    # Install dependencies
    # -------------------------------------------------
    - name: Install dependencies
      run: npm install


    # -------------------------------------------------
    # Install Playwright browsers
    # -------------------------------------------------
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps


    # -------------------------------------------------
    # Detect latest Jira test file
    # -------------------------------------------------
    - name: Detect Latest Test File
      id: detect
      run: |

        FILE=$(ls -t testscripts/*.spec.ts | head -n 1)

        ISSUE_KEY=$(basename "$FILE" | grep -oE '[A-Z]+-[0-9]+')

        echo "TEST_FILE=$FILE" >> $GITHUB_ENV
        echo "ISSUE_KEY=$ISSUE_KEY" >> $GITHUB_ENV

        echo "Latest Test File: $FILE"
        echo "Issue Key: $ISSUE_KEY"


    # -------------------------------------------------
    # Run ONLY latest test
    # -------------------------------------------------
    - name: Run Playwright Test
      run: |

        echo "Running test: $TEST_FILE"

        npx playwright test "$TEST_FILE" \
          --reporter=json,html \
          --output=test-results \
          || true

        if [ ! -f result.json ]; then
          echo '{"stats":{"expected":0,"unexpected":0,"skipped":0,"flaky":0,"duration":0}}' > result.json
        fi


    # -------------------------------------------------
    # Parse Results
    # -------------------------------------------------
    - name: Parse Results
      run: |

        PASSED=$(jq -r '.stats.expected // 0' result.json)
        FAILED=$(jq -r '.stats.unexpected // 0' result.json)
        SKIPPED=$(jq -r '.stats.skipped // 0' result.json)
        FLAKY=$(jq -r '.stats.flaky // 0' result.json)
        DURATION=$(jq -r '.stats.duration // 0' result.json)

        TOTAL=$((PASSED + FAILED + SKIPPED + FLAKY))

        echo "TOTAL=$TOTAL" >> $GITHUB_ENV
        echo "PASSED=$PASSED" >> $GITHUB_ENV
        echo "FAILED=$FAILED" >> $GITHUB_ENV
        echo "DURATION=$DURATION" >> $GITHUB_ENV

        if [ "$TOTAL" -eq 0 ]; then
          STATUS="❌ FAILED (NO TESTS)"
        elif [ "$FAILED" -gt 0 ]; then
          STATUS="❌ FAILED"
        else
          STATUS="✅ PASSED"
        fi

        echo "STATUS=$STATUS" >> $GITHUB_ENV


    # -------------------------------------------------
    # Prepare GitHub Pages folder per Jira Story
    # -------------------------------------------------
    - name: Prepare Pages Content
      run: |

        mkdir -p pages/$ISSUE_KEY

        cp -r playwright-report/* pages/$ISSUE_KEY/


    # -------------------------------------------------
    # Deploy to GitHub Pages (gh-pages branch)
    # -------------------------------------------------
    - name: Deploy Report to GitHub Pages
      uses: peaceiris/actions-gh-pages@v4
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./pages
        publish_branch: gh-pages
        keep_files: true


    # -------------------------------------------------
    # Generate Report URL
    # -------------------------------------------------
    - name: Generate Report URL
      run: |

        REPORT_URL="https://${{ github.repository_owner }}.github.io/Playwright-Automation/$ISSUE_KEY/index.html"

        echo "REPORT_URL=$REPORT_URL" >> $GITHUB_ENV

        echo "Report URL: $REPORT_URL"


    # -------------------------------------------------
    # Upload Artifacts (optional backup)
    # -------------------------------------------------
    - name: Upload Artifacts
      uses: actions/upload-artifact@v4
      with:
        name: playwright-artifacts-${{ env.ISSUE_KEY }}
        path: |
          playwright-report/
          test-results/
          result.json


    # -------------------------------------------------
    # Post Results to Jira
    # -------------------------------------------------
    - name: Post Results to Jira
      if: env.ISSUE_KEY != ''
      run: |

        curl -X POST \
        -u "${{ secrets.JIRA_EMAIL }}:${{ secrets.JIRA_API_TOKEN }}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        --data "{

          \"body\": {
            \"type\": \"doc\",
            \"version\": 1,
            \"content\": [

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {
                    \"type\": \"text\",
                    \"text\": \"🤖 AI Automation Result: $STATUS\"
                  }
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {
                    \"type\": \"text\",
                    \"text\": \"Issue: $ISSUE_KEY\"
                  }
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {
                    \"type\": \"text\",
                    \"text\": \"Total: $TOTAL | Passed: $PASSED | Failed: $FAILED\"
                  }
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {
                    \"type\": \"text\",
                    \"text\": \"Execution Time: $DURATION ms\"
                  }
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {
                    \"type\": \"text\",
                    \"text\": \"📊 View Full Report: $REPORT_URL\"
                  }
                ]
              }

            ]
          }

        }" \
        "${{ secrets.JIRA_BASE_URL }}/rest/api/3/issue/${ISSUE_KEY}/comment"


    # -------------------------------------------------
    # Fail workflow if failed
    # -------------------------------------------------
    - name: Fail if tests failed
      if: env.FAILED != '0' || env.TOTAL == '0'
      run: exit 1