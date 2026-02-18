import subprocess
import sys
from pathlib import Path

def run_playwright_test(test_file: str = None, headed: bool = True):
    """
    Run Playwright tests
    
    Args:
        test_file: Specific test file to run (e.g., 'SCRUM-5_RegressionTestSuite_02-12-2026-1614.ts')
        headed: Run in headed mode (browser visible)
    """
    
    print("\n" + "="*60)
    print("🎭 Running Playwright Test")
    print("="*60 + "\n")
    
    # Build command
    cmd = ["npx", "playwright", "test"]
    
    if test_file:
        # Run specific test file
        cmd.append(f"testscripts/{test_file}")
        print(f"📝 Test File: {test_file}")
    else:
        print("📝 Running all tests in testscripts/")
    
    if headed:
        cmd.append("--headed")
        print("👁️  Mode: Headed (browser visible)")
    else:
        print("🔇 Mode: Headless")
    
    print("\n" + "-"*60 + "\n")
    
    try:
        # Run the test
        result = subprocess.run(
            cmd,
            check=False,
            cwd=Path(__file__).parent
        )
        
        print("\n" + "="*60)
        if result.returncode == 0:
            print("✅ Test PASSED!")
        else:
            print("❌ Test FAILED!")
        print("="*60 + "\n")
        
        return result.returncode == 0
        
    except FileNotFoundError:
        print("❌ Error: Playwright not found!")
        print("   Please run: npm install -D @playwright/test")
        print("   Then run: npx playwright install")
        return False
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False

def main():
    """Main entry point"""
    
    # Check if test file provided as argument
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
    else:
        # List available test files
        testscripts_dir = Path(__file__).parent / "testscripts"
        if testscripts_dir.exists():
            test_files = list(testscripts_dir.glob("*.ts"))
            
            if not test_files:
                print("❌ No test files found in testscripts/")
                print("\nUsage: python run_playwright_test.py <test_file.ts>")
                sys.exit(1)
            
            if len(test_files) == 1:
                # Only one test file, run it
                test_file = test_files[0].name
                print(f"Found 1 test file: {test_file}")
            else:
                # Multiple files, ask user to specify
                print("Available test files:")
                for i, f in enumerate(test_files, 1):
                    print(f"  {i}. {f.name}")
                print("\nUsage: python run_playwright_test.py <test_file.ts>")
                sys.exit(0)
        else:
            print("❌ testscripts/ directory not found")
            sys.exit(1)
    
    # Run the test
    success = run_playwright_test(test_file, headed=True)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()