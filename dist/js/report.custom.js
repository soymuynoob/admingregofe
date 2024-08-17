document.addEventListener("DOMContentLoaded", async function () {
  const url = "https://pripri-production.up.railway.app/api/user/report/money/amount";
  const token = localStorage.getItem("authToken");

  // Datos de ejemplo para el gráfico de ventas por usuario
  const userData = {};
  async function report() {
    try {
      const response = await fetch(
        `${url}?dateInit=2024-01-01&dateEnd=2024-12-31`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Error fetching data from API");

      const data = await response.json();
      console.log({ data: data.data });

      userData.labels = data.data[0].meses.split(",");
      userData.datasets = data.data;
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }
  await report();
  console.log({ userData });

  // Configuración del gráfico de ventas por usuario
  const userConfig = {
    type: "bar",
    data: userData,
    options: {
      indexAxis: "x", // Cambia el gráfico a barras horizontales
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: {
              weight: "bold", // Poner el texto en negrita
              size: 16, // Ajusta el tamaño de la fuente
            },
            color: "#000", // Puedes cambiar el color del texto si lo deseas
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + ": " + context.raw + "%";
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  // Crear el gráfico
  const userChart = new Chart(document.getElementById("userChart"), userConfig);
});
