import gzip
#import simplejson

def parse(filename):
  f = gzip.open(filename, 'r')
  entry = {}
  for l in f:
    l = l.strip()
    colonPos = l.find(':')
    if colonPos == -1:
      yield entry
      entry = {}
      continue
    eName = l[:colonPos]
    rest = l[colonPos+2:]
    entry[eName] = rest
  yield entry

prodId = []
userId = []
helpful = []
score = []
data = []
fields = ['product/productId', 'review/userId', 'review/helpfulness', 'review/score']
for e in parse("movies.txt.gz"):
  try:
    data.append([e[field] for field in fields])
  except:
    print e

res = open('output.txt', 'w')
res.write(', '.join(fields)+'\n')
for d in data:
  try:
    res.write(', '.join(d)+'\n')
  except:
    print type(d)
res.close()
