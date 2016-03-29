import json
import sys

def helpfulness(score):
    if eval(score.split('/')[1]) != 0:
        return eval(score) * eval(score.split('/')[0])
    else:
        return 0

def update_node(node, record):
    helpful = record["review/helpfulness"]
    score = record["review/score"]
    node["count"] += 1
    node["helpful"] += helpfulness(helpful)
    node["scores"] += eval(score)
    return node

def add_node(record):
    helpful = record["review/helpfulness"]
    score = record["review/score"]
    h = helpfulness(helpful)
    s = eval(score)
    return {"name": record["review/userId"], "count": 1, "helpful": h, "scores": s}

def similarity(score1, score2):
    return 5 - abs(score1  - score2)

filename = sys.argv[1]
f = open(filename)

min_reviews = 10
min_shared = 1

nodes = {}
tlinks = {}
header = f.readline().strip().split(', ')
for line in f.readlines():
    record = line.strip().split(', ')
    r = dict(zip(header, record))
    uid = r["review/userId"]
    pid = r["product/productId"]
    score = eval(r["review/score"])
    if uid in nodes:
        nodes[uid] = update_node(nodes[uid], r)
    else:
        nodes[uid] = add_node(r)
    if pid in tlinks:
        tlinks[pid].append((uid, score))
    else:
        tlinks[pid] = [(uid, score)]
links = {} 
user_nodes = nodes
for link, nodes in tlinks.iteritems():
    for i in range(len(nodes)):
        for j in range(i, len(nodes)):
            count_i = user_nodes[nodes[i][0]]["count"]
            count_j = user_nodes[nodes[j][0]]["count"]
            if count_i < min_reviews or count_j < min_reviews:
                continue
            edge = nodes[i][0]+"-"+nodes[j][0]
            edge2 = nodes[j][0]+"-"+nodes[j][0]
            if edge2 in links:
                edge = edge2
            if edge in links:
                links[edge]["pid"].append(link)
                links[edge]["weight"].append(similarity(nodes[i][1], nodes[j][1]))
            else:
                links[edge] = {"source":nodes[i][0], "target":nodes[j][0], "pid": [link], "weight": [similarity(nodes[i][1], nodes[j][1])]}
            #links.append({"pid"target"":link, "source": nodes[i][0], "target": nodes[j][0], "weight": similarity(nodes[i][1], nodes[j][1])})


r_user_nodes = [user_nodes[u] for u in user_nodes if user_nodes[u]["count"] >= min_reviews]
r_links = [links[link] for link in links if len(links[link]["weight"]) >= min_shared]
out_filename = filename.replace("raw.txt", "graph.json")
results = {"nodes": r_user_nodes, "links":r_links}
with open(out_filename, "w") as outfile:
    json.dump(results, outfile)
