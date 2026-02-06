import subprocess
import re

try:
    gcloud_path = r"C:\Users\Gamini\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
    process = subprocess.Popen([gcloud_path, 'auth', 'login', '--no-launch-browser'], 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE, 
                               text=True)
    
    # Read output and combine into one string
    output = ""
    for line in iter(process.stderr.readline, ''):
        output += line
        if "Once finished" in line:
            break
            
    # Clean up the URL
    # Look for the URL start
    match = re.search(r'https://accounts.google.com/o/oauth2/auth\?.*', output.replace('\n', '').replace(' ', ''))
    if match:
        print("CLEAN_URL:" + match.group(0).split('Oncefinished')[0])
    else:
        print("URL not found in output:")
        print(output)
        
    process.terminate()
except Exception as e:
    print(f"Error: {e}")
