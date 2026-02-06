import subprocess
import re
import time

gcloud_path = r"C:\Users\Gamini\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
process = subprocess.Popen([gcloud_path, 'auth', 'login', '--no-launch-browser'], 
                           stderr=subprocess.PIPE, 
                           stdout=subprocess.PIPE,
                           text=True)

time.sleep(5)
process.terminate()
stderr_output = process.stderr.read()

# Combine lines and clean up whitespace
clean_string = "".join(stderr_output.splitlines())
match = re.search(r'https://accounts.google.com/o/oauth2/auth\?[\w=&%.\-]+', clean_string)

if match:
    # Specifically look for common parts of the URL to ensure we get the full thing
    url = match.group(0)
    # The regex above might stop at special chars, let's be more aggressive
    full_match = re.search(r'https://accounts.google.com/o/oauth2/auth\?\S+', clean_string)
    if full_match:
        final_url = full_match.group(0).split('Once')[0]
        print(f"URL: {final_url}")
else:
    print("Could not find URL")
    print("DEBUG OUTPUT:")
    print(clean_string)
