import random
import string
import csv

f = open('list.csv','r')
rdr = csv.reader(f)

team = []

for line in rdr:
    team.append(line)
 
f.close()

pool = string.ascii_uppercase + string.digits;

result = []

for i in range(len(team)):
    if(i != 0):
        password = random.choices(pool,k=6)
    else:
        password = '비밀번호'
    team[i].append(''.join(password))

f = open('list_password.csv','w',newline='')
wr = csv.writer(f)
wr.writerows(team)

f.close()