"""
PLAN

- Get random walk paths (epoch=1)
- Each update to the embedding after a given random walk path
- If possible, get the by-node update (each pass of the loss)

"""
# %%
import nodevectors
import plotly.express as px
import pandas as pd
import networkx as nx
import plotly.graph_objs as go
import plotly.offline as pyo
from embedding_functions import *
from experiment_setup import *
from plotly.subplots import make_subplots

# %%


@nb.njit()
def make_dynamic_network(n, T=2, move_prob=0.4, K=2):
    # Ensure equal community sizes
    if n % K != 0:
        raise ValueError("n must be divisible by the number of communities")

    tau = np.repeat(np.arange(0, K), int(n / K))
    np.random.shuffle(tau)

    # Generate B matrices
    B_list = np.zeros((T, K, K))

    move_amount = np.abs(move_prob - 0.5)
    comm_probs = np.linspace(0.1, 0.9, K)

    # comm_probs = np.random.uniform(0.1, 0.9, K)

    for t in range(T):
        # comm_to_change = np.random.choice(np.arange(0, K))
        comm_to_change = t % K

        # B_for_change = B_for_time.copy()
        # B_for_change[1, 1] = B_for_change[1, 1] + move_amount

        B_for_change = np.ones((K, K)) * 0.5
        np.fill_diagonal(B_for_change, comm_probs)

        if B_for_change[comm_to_change, comm_to_change] < 1 - move_amount:
            B_for_change[comm_to_change, comm_to_change] = (
                B_for_change[comm_to_change, comm_to_change] + move_amount
            )
        else:
            B_for_change[comm_to_change, comm_to_change] = (
                B_for_change[comm_to_change, comm_to_change] - move_amount
            )

        B_list[t] = B_for_change

    # Generate adjacency matrices
    As = np.zeros((T, n, n))
    for t in range(T):
        P_t = np.zeros((n, n))
        for i in range(n):
            P_t[:, i] = B_list[t][tau, tau[i]]

        A_t = np.random.uniform(0, 1, n**2).reshape((n, n)) < P_t
        As[t] = A_t

    return (As, tau)


# %%

# %%
B = np.array([[0.9, 0.2, 0.1], [0.2, 0.9, 0.2], [0.1, 0.2, 0.9]])
K = 3
n = K * 10
T = 1
As, tau = sbm_from_B([B], n=n)
# As, tau = make_dynamic_network(n, T=T, move_prob=0.3, K=K)
# %%

# ya = embed(As, 2, method="UASE")

import nodevectors
from sklearn.decomposition import PCA

ya = nodevectors.Node2Vec(
    n_components=2, walklen=6, epochs=300, w2vparams={"window": 2}
).fit_transform(As[0])


plot_embedding(ya, n, T, tau)


# %%
"""
Need to save:

1. Random walks at each epoch
2. Embedding at each epoch
"""

# %%
# Train and save

# n = 100
# T = 10
# As, tau, _ = make_temporal_simple(n=n, T=T, move_prob=0.4)

# ya = embed(As, 2, method="UASE")

from dyn_skip_gram import dyn_skip_gram
from dyn_skip_gram import Node2Vec_for_dyn_skip_gram

# ya = dyn_skip_gram(As, 2)
plot_embedding(ya, n, T, tau)

# %%
ya_list = []
num_epochs = 300

n = 3000
As, tau = sbm_from_B([B], n=n)

n2v_obj = nodevectors.Node2Vec(
    n_components=2, walklen=1, epochs=5, w2vparams={"window": 1}
)
ya = n2v_obj.fit_transform(As[0])

plot_embedding(ya, n, T, tau)

# %%

# %%
ya_list = []
num_epochs = 2000

n = 30
As, tau = sbm_from_B([B], n=n)


from tqdm import tqdm


for i in tqdm(range(num_epochs)):
    n2v_obj = Node2Vec_for_dyn_skip_gram(
        n_components=2, walklen=3, epochs=30, w2vparams={"window": 2}
    )

    if i == 0:
        n2v_obj.fit(As[0])
        n2v_obj.save_vectors("walks/wv_save" + str(i) + ".emb")
    else:
        n2v_obj.fit(As[0], update_file="walks/wv_save" + str(i - 1) + ".emb")
        n2v_obj.save_vectors("walks/wv_save" + str(i) + ".emb")

    ya_t = np.array([n2v_obj.predict(str(i)) for i in range(n)])
    ya_list.append(ya_t)

ya = np.row_stack(ya_list)

# %%
df = pd.DataFrame(
    {
        "x_emb": ya[:, 0],
        "y_emb": ya[:, 1],
        "t": np.repeat(np.arange(0, T), n),
        "tau": np.tile(tau, T),
        "id": np.tile(np.arange(0, n), T),
    }
)
# %%
# save
df.to_csv("data/dynamic_embedding_df.csv")

from networkx.readwrite import json_graph
import json

G_list = []
for t in range(T):
    G = nx.from_numpy_array(As[t])
    G_list.append(G)

# Save json graph
for i, G in enumerate(G_list):
    # Convert tau_for_graphs to a list of ints
    # Set tau as a node attribute
    nx.set_node_attributes(G, dict(zip(G.nodes(), tau.astype(int).tolist())), "tau")
    # Save graph as a JSON file
    with open(f"data/graph_t={i}.json", "w") as f:
        json.dump(json_graph.node_link_data(G), f)


# save spring layout positions
for t in range(T):
    G = G_list[t]
    pos = nx.spring_layout(G)

    # Save the spring layout positions of the nodes and edge in a dataframe format, similar to how we saved ya for each graph in graph_list
    pos_df = pd.DataFrame.from_dict(pos, orient="index")
    pos_df.columns = ["x", "y"]
    pos_df["id"] = pos_df.index
    pos_df["t"] = t
    pos_df["tau"] = tau
    pos_df.to_csv("data/pos_df_t={}.csv".format(t))

# %%

# %%
df = pd.read_csv("data/dynamic_embedding_df.csv")

# %%
fig = px.scatter(
    df,
    x="x_emb",
    y="y_emb",
    animation_frame="t",
    color="tau",
    range_x=[-1, 1],
    range_y=[-1, 1],
)
fig

# %%
func1 = 0
func2 = 0

func1_list = []
func2_list = []
for i in range(100):
    func1 = func1 + 0.5
    func2 = func2 + np.exp(0.5) * 3
    func1_list.append(func1)
    func2_list.append(func2)

func2_list = np.log(np.array(func2_list))

func1_list[-1] / func2_list[-1]
# %%
arr = np.arange(0, 500)

func1 = np.sum(arr)
func2 = np.log(np.sum(np.exp(arr)))

func1 / func2

# %%
from dyn_skip_gram import dyn_skip_gram
from dyn_skip_gram import Node2Vec_for_dyn_skip_gram

ya_list = []
num_epochs = 500

n = 300
As, tau = sbm_from_B([B], n=n)


from tqdm import tqdm


loss_list = []
func1_list = []
func2_list = []
n2v_obj = Node2Vec_for_dyn_skip_gram(
    n_components=2,
    walklen=3,
    epochs=30,
    w2vparams={"window": 2, "compute_loss": True},
)
for i in tqdm(range(num_epochs)):
    if i == 0:
        n2v_obj.fit(As[0])
        n2v_obj.save_vectors("walks/wv_save" + str(i) + ".emb")
    else:
        n2v_obj.fit(As[0], update_file="walks/wv_save" + str(i - 1) + ".emb")
        n2v_obj.save_vectors("walks/wv_save" + str(i) + ".emb")

    ya_t = np.array([n2v_obj.predict(str(i)) for i in range(n)])
    ya_list.append(ya_t)

    # Approx likelihood
    loss = 0
    for i in range(n):
        node = ya_t[i, :]
        comm = ya_t[tau == tau[i], :]
        func1 = 0
        func2 = 0
        for node_neighbour in comm:
            if not np.array_equal(node, node_neighbour):
                func1 = np.dot(node_neighbour, node) + func1

        for non_neighbour in ya_t:
            func2 = np.exp(np.dot(non_neighbour, node)) + func2

        func2 = np.log(func2)

        loss = func1 - func2

    loss_list.append(loss)
    func1_list.append(func1)
    func2_list.append(func2)

ya = np.row_stack(ya_list)

# %%
# plt.plot(loss_list)

# plotly plot func1 func2 and loss
fig = make_subplots(specs=[[{"secondary_y": True}]])
fig.add_trace(
    go.Scatter(x=np.arange(0, num_epochs), y=func1_list, name="func1"),
    secondary_y=False,
)
fig.add_trace(
    go.Scatter(x=np.arange(0, num_epochs), y=func2_list, name="func2"),
    secondary_y=False,
)
fig.add_trace(
    go.Scatter(x=np.arange(0, num_epochs), y=loss_list, name="loss"), secondary_y=True
)
fig.show()


# %%
plot_embedding(ya, n, num_epochs, tau)
# %%
ya.shape

ya_1 = ya[n * 64 : n * 65, :]
