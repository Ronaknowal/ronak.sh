"""Descriptive count information; offline CC0 Palmer penguins, all selected fields."""
import csv
import hashlib
import math
from pathlib import Path
import numpy as np
from sklearn.metrics import mutual_info_score

SPECIES = ('Adelie', 'Chinstrap', 'Gentoo')
ISLANDS = ('Biscoe', 'Dream', 'Torgersen')
DATA_SHA256 = 'f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93'


def count_table(records, grouped=False):
    table = [[0]*(2 if grouped else 3) for _ in SPECIES]
    for row in records:
        i = SPECIES.index(row['species'])
        j = (0 if row['island']=='Biscoe' else 1) if grouped else ISLANDS.index(row['island'])
        table[i][j] += 1
    return table


def information(counts):
    total = sum(map(sum, counts))
    if total == 0:
        raise ValueError('no empirical law for empty records')
    rows = list(map(sum, counts))
    cols = [sum(row[j] for row in counts) for j in range(len(counts[0]))]
    return sum(n/total*(math.log2(n)+math.log2(total)-math.log2(rows[i])-math.log2(cols[j]))
               for i,row in enumerate(counts) for j,n in enumerate(row) if n > 0)


def main():
    dataset = Path(__file__).with_name('penguins.csv')
    assert hashlib.sha256(dataset.read_bytes()).hexdigest() == DATA_SHA256
    with dataset.open(newline='', encoding='utf-8') as file:
        records = list(csv.DictReader(file))
    if any(row['species'] not in SPECIES or row['island'] not in ISLANDS
           or row['year'] not in ('2007','2008','2009') for row in records):
        raise ValueError('unexpected selected-field value')
    results=[]
    for year in ('all','2007','2008','2009'):
        selected = records if year=='all' else [r for r in records if r['year']==year]
        table, grouped = count_table(selected), count_table(selected, True)
        mi, reduced = information(table), information(grouped)
        library = float(mutual_info_score(None,None,contingency=np.array(table)))/math.log(2)
        assert abs(mi-library) < 1e-12
        assert reduced <= mi+1e-12
        assert abs(information([[sum(row)] for row in table])) < 1e-12
        print(year, 'N', len(selected), 'species-by-island counts', table)
        print('MI / coarsened MI / discarded bits', *[f'{v:.9f}' for v in [mi,reduced,mi-reduced]])
        if year!='all':
            results.append((len(selected),mi))
    conditional = sum(n*mi for n,mi in results)/len(records)
    uniform = sum(mi for _,mi in results)/len(results)
    print('year counts', [n for n,_ in results])
    print('I(species;island|year) / uniform-year mean bits', f'{conditional:.9f}', f'{uniform:.9f}')


if __name__ == '__main__':
    main()
