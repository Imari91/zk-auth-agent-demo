import hashlib

plan_string = "rotate_secret|vault/prod/db_password|PR-8421"
print(int(hashlib.sha256(plan_string.encode()).hexdigest(), 16))
