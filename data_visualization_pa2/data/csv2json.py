def load_csv():
    file = open("top25.csv", "r")
    datas = file.read()
    datas = datas.split('\n')
    return datas;
    
def generate_graph(csv_datas):
    graph = {'nodes': {}, 'edges': {}}
    for csv_data in csv_datas:
        hero, comic = csv_data.split(";")
        if (hero not in graph['nodes']):
            graph['nodes'][hero] = {'name': hero, 'size':1, 'other_heroes':{}}
        else:
            graph['nodes'][hero]['size'] += 1
        
        if (comic not in graph['edges']):
            graph['edges'][comic] = [hero]
        else:
            graph['edges'][comic].append(hero)
        
        for hero_in_comic in graph['edges'][comic]:
            if (hero <> hero_in_comic):
                if (hero not in graph['nodes'][hero_in_comic]['other_heroes']):
                    graph['nodes'][hero_in_comic]['other_heroes'][hero] = 0
                graph['nodes'][hero_in_comic]['other_heroes'][hero] += 1
                if (hero_in_comic not in graph['nodes'][hero]['other_heroes']):
                    graph['nodes'][hero]['other_heroes'][hero_in_comic] = 0
                graph['nodes'][hero]['other_heroes'][hero_in_comic] += 1
                
    return graph
        
def write_json(graph):
    file = open("top25_graph.json", "w")
    file.write('[\n')
    for node_idx in range(len(graph['nodes'].keys())): 
        node = sorted(graph['nodes'].keys())[node_idx]
        file.write('{"name":"' + graph['nodes'][node]['name'] + '", "size":' + str(graph['nodes'][node]['size']) + ', "imports":{')
        for other_hero_idx in range(len(graph['nodes'][node]['other_heroes'].keys())):
            other_hero = graph['nodes'][node]['other_heroes'].keys()[other_hero_idx]
            file.write('"')
            file.write(other_hero + '":' + str(graph['nodes'][node]['other_heroes'][other_hero]))
            if (other_hero_idx < len(graph['nodes'][node]['other_heroes']) - 1):
                file.write(',')
        if (node_idx < len(graph['nodes'].keys()) - 1):
            file.write('}},\n')
        else:
            file.write('}}\n')
        
    file.write(']')
    file.close()    
    
csv_datas = load_csv()
graph = generate_graph(csv_datas)
print graph['edges']['A 100']
write_json(graph)