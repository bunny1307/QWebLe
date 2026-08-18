from getpass import getpass
from werkzeug.security import generate_password_hash

password = getpass('New admin password: ')
confirm = getpass('Repeat password: ')
if password != confirm:
    raise SystemExit('Passwords do not match.')
if len(password) < 12:
    raise SystemExit('Use at least 12 characters.')
print(generate_password_hash(password))
