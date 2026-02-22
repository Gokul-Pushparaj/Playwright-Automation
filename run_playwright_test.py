name: Enterprise Playwright Automation

on:
  push:
    paths:
      - 'testscripts/*.spec.ts'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:

  test:

    runs-on: ubuntu-latest

    steps:

    # --------------------------------
    # Checkout repository
    # --------------------------------
    - name: Checkout repository
      uses: actions/checkout@v4


    # --------------------------------
    # Setup Node
    # --------------------------------
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: 20


    # --------------------------------
    # Install dependencies
    # --------------------------------
    - name: Install dependencies
      run: npm install


    # --------------------------------
    # Install Playwright Browsers
    # --------------------------------
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps


    # --------------------------------
    # Find latest generated test file
    # --------------------------------
    - name: Get latest test file
      run: |
        LATEST_TEST=$(ls -t testscripts/*.spec.ts | head -n 1)
        echo "LATEST_TEST=$LATEST_TEST" >> $GITHUB_ENV
        echo "Latest test file: $LATEST_TEST"


    # --------------------------------
    # Run Playwright test
    # --------------------------------
    - name: Run Playwright tests
      run: |

        echo "Running Playwright test: $LATEST_TEST"

        npx playwright test "$LATEST_TEST" \
          --reporter=json,html \
          --output=test-results \
          > result.json || true

        # fallback result.json
        if [ ! -f result.json ]; then
          echo '{"stats":{"expected":0,"unexpected":0,"skipped":0,"flaky":0,"duration":0}}' > result.json
        fi


    # --------------------------------
    # Upload artifacts (screenshots, videos, traces)
    # --------------------------------
    - name: Upload Test Artifacts
      uses: actions/upload-artifact@v4
      with:
        name: playwright-artifacts
        path: |
          playwright-report/
          test-results/
          result.json
        retention-days: 30


    # --------------------------------
    # Publish Playwright report to GitHub Pages
    # --------------------------------
    - name: Upload Pages artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: playwright-report


    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4


    # --------------------------------
    # Extract Issue Key
    # --------------------------------
    - name: Extract Issue Key
      run: |

        ISSUE_KEY=$(basename "$LATEST_TEST" | grep -oE '[A-Z]+-[0-9]+')

        echo "ISSUE_KEY=$ISSUE_KEY" >> $GITHUB_ENV

        echo "Issue Key: $ISSUE_KEY"


    # --------------------------------
    # Parse Results
    # --------------------------------
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
        echo "SKIPPED=$SKIPPED" >> $GITHUB_ENV
        echo "DURATION=$DURATION" >> $GITHUB_ENV

        if [ "$TOTAL" -eq 0 ]; then
          STATUS="❌ FAILED (NO TESTS EXECUTED)"
        elif [ "$FAILED" -gt 0 ]; then
          STATUS="❌ FAILED"
        else
          STATUS="✅ PASSED"
        fi

        echo "STATUS=$STATUS" >> $GITHUB_ENV

        echo "Status: $STATUS"


    # --------------------------------
    # Generate GitHub Pages Report URL
    # --------------------------------
    - name: Generate Report URL
      run: |

        REPORT_URL="https://${{ github.repository_owner }}.github.io/$(echo '${{ github.repository }}' | cut -d'/' -f2)/"

        echo "REPORT_URL=$REPORT_URL" >> $GITHUB_ENV

        echo "Report URL: $REPORT_URL"


    # --------------------------------
    # Post Enterprise Comment to Jira
    # --------------------------------
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
                    \"text\": \"🤖 AI Automation Execution Result: $STATUS\"
                  }
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {\"type\":\"text\",\"text\":\"Tested Story: $ISSUE_KEY\"}
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {\"type\":\"text\",\"text\":\"Total Tests: $TOTAL\"}
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {\"type\":\"text\",\"text\":\"Passed: $PASSED\"}
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {\"type\":\"text\",\"text\":\"Failed: $FAILED\"}
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {\"type\":\"text\",\"text\":\"Execution Time: $DURATION ms\"}
                ]
              },

              {
                \"type\": \"paragraph\",
                \"content\": [
                  {
                    \"type\":\"text\",
                    \"text\":\"📊 View Full Playwright Report: $REPORT_URL\"
                  }
                ]
              }

            ]
          }

        }" \
        "${{ secrets.JIRA_BASE_URL }}/rest/api/3/issue/${ISSUE_KEY}/comment"


    # --------------------------------
    # Fail workflow if tests failed
    # --------------------------------
    - name: Fail workflow if tests failed
      if: env.FAILED != '0' || env.TOTAL == '0'
      run: exit 1