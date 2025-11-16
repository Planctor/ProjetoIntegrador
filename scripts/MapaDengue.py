import pandas as pd
import plotly.express as px
import os

#caminhos dos arquivo

def AnaliseDengue():
    arq = os.getcwd()
    csv_caminho_municipios = csv_path = os.path.join(arq, "arquivos", "municipios.csv")
    csv_caminho_dengue = csv_path = os.path.join(arq, "arquivos", "DENGBR25.csv")

    dados_dengue = pd.read_csv(csv_caminho_dengue, low_memory=False, delimiter=",")

    #tabela dinamica na tabela dengue, para pegar os valores necessario
    tratamento_dengue = pd.pivot_table(
        dados_dengue,
        index='ID_MUNICIP',
        values=['ID_AGRAVO'],
        aggfunc='count'
    )

    municipio = pd.read_csv(csv_caminho_municipios, low_memory=False, delimiter=",")

    #tratamento na planilha dos municipios, contem 7 digitos na de dengue 6
    #necessario senão retorna com NaN
    municipio['codigo_ibge'] = municipio['codigo_ibge'].astype(str).str[:-1].astype(int)

    #filtro as colunas que quero que entre
    colunas_desejadas = ["codigo_ibge","latitude", "longitude"]
    df2_filtrado = municipio[colunas_desejadas]

    # merge das 2 planilhas, onde se pega o codigo do municipio e devolve as cooredanadas com base na planilha de ibge
    csv_final = tratamento_dengue.merge(
        df2_filtrado,
        left_on="ID_MUNICIP",
        right_on="codigo_ibge",
        how="left"
    )

    #dropa a coluna, codigo ibge, evita redundancia
    csv_final.drop(columns=['codigo_ibge'], inplace=True)
    #print(csv_final)

    #configuração do mapa e dos valores
    mapa = px.density_map(
        csv_final,
        lat="latitude",
        lon="longitude",
        z="ID_AGRAVO" ,
        radius=10,
        range_color=[0, 20],
        center=dict(lat=-14.2, lon=-51.9),
        zoom=4,
        opacity=0.7,
        map_style="open-street-map"    
    )

    #tratamendo do mapa
    mapa.update_layout(
        margin={
        "r": 0,
        "t": 0,
        "b": 0,
        "l": 0
    })

    #Salva a pagina como html
    arquivo_html = os.path.join(arq + "/html_gerado", "mapa_dengue.html")
    mapa.write_html(arquivo_html)

    #mostra o mapa
    return mapa.show()