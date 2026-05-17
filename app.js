const { createApp } = Vue;

const API_URL = "https://chic-and-glow.myshopify.com/api/2024-01/graphql.json";
const API_TOKEN = "atkn_edbf39aa7e601acded79bdfd79d36e3564b7248d8e815311d4cc48651bf8c002"; // ← pega aquí tu token

async function fetchProductsFromShopify() {
  const query = `
    {
      products(first: 30) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            tags
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": API_TOKEN
    },
    body: JSON.stringify({ query })
  });

  const json = await response.json();
  const edges = json?.data?.products?.edges || [];

  return edges.map(edge => {
    const node = edge.node;
    const variant = node.variants?.edges?.[0]?.node || {};
    const price = variant.price || {};
    const compareAt = variant.compareAtPrice || {};
    const image = node.images?.edges?.[0]?.node?.url || null;

    const amount = parseFloat(price.amount || 0);
    const compareAmount = parseFloat(compareAt.amount || 0);

    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      description: node.description || "",
      shortDescription: (node.description || "").length > 110
        ? node.description.slice(0, 110) + "..."
        : node.description || "Pieza versátil para combinar con tu estilo.",
      image,
      price: amount,
      currency: price.currencyCode || "EUR",
      priceFormatted: amount ? `${amount.toFixed(2)} ${price.currencyCode || "EUR"}` : "Consultar",
      compareAtPriceFormatted: compareAmount
        ? `${compareAmount.toFixed(2)} ${compareAt.currencyCode || "EUR"}`
        : null,
      productType: node.productType || "",
      tags: node.tags || [],
      isNew: node.tags?.includes("new") || node.tags?.includes("nuevo") || false
    };
  });
}

createApp({
  data() {
    return {
      products: [],
      filteredProducts: [],
      highlightProduct: null,
      loading: true,
      searchQuery: "",
      priceRange: 300,
      selectedCategory: null,
      categories: [
        {
          name: "Ropa",
          description: "Vestidos, tops, pantalones y más para tu día a día y ocasiones especiales.",
          image: "https://images.pexels.com/photos/6311579/pexels-photo-6311579.jpeg?auto=compress&cs=tinysrgb&w=1200"
        },
        {
          name: "Accesorios",
          description: "Bolsos, joyería y detalles que elevan cualquier look.",
          image: "https://images.pexels.com/photos/1036856/pexels-photo-1036856.jpeg?auto=compress&cs=tinysrgb&w=1200"
        },
        {
          name: "Belleza",
          description: "Productos para cuidar tu piel y resaltar tu glow natural.",
          image: "https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=1200"
        },
        {
          name: "Lounge & Home",
          description: "Prendas cómodas y suaves para estar en casa con estilo.",
          image: "https://images.pexels.com/photos/3738086/pexels-photo-3738086.jpeg?auto=compress&cs=tinysrgb&w=1200"
        }
      ],
      form: {
        nombre: "",
        email: "",
        mensaje: ""
      }
    };
  },

  computed: {
    formattedPriceRange() {
      return `${this.priceRange.toFixed(0)} €`;
    }
  },

  methods: {
    async loadProducts() {
      try {
        this.loading = true;
        const products = await fetchProductsFromShopify();
        this.products = products;
        this.filteredProducts = products;
        this.highlightProduct = products[0] || null;
      } catch (error) {
        console.error("Error cargando productos de Shopify:", error);
      } finally {
        this.loading = false;
      }
    },

    filterProducts() {
      const query = this.searchQuery.toLowerCase().trim();
      const maxPrice = this.priceRange;

      this.filteredProducts = this.products.filter(product => {
        const matchesSearch =
          !query ||
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);

        const matchesPrice = !product.price || product.price <= maxPrice;

        let matchesCategory = true;
        if (this.selectedCategory) {
          const cat = this.selectedCategory.toLowerCase();
          const type = product.productType.toLowerCase();
          const tags = (product.tags || []).map(t => t.toLowerCase());
          matchesCategory =
            type.includes(cat) ||
            tags.some(t => t.includes(cat));
        }

        return matchesSearch && matchesPrice && matchesCategory;
      });
    },

    resetFilters() {
      this.searchQuery = "";
      this.priceRange = 300;
      this.selectedCategory = null;
      this.filteredProducts = this.products;
    },

    toggleCategory(categoryName) {
      this.selectedCategory =
        this.selectedCategory === categoryName ? null : categoryName;
      this.filterProducts();
    },

    submitForm() {
      alert("Gracias por tu mensaje, " + this.form.nombre + ". Te responderemos lo antes posible.");
      this.form.nombre = "";
      this.form.email = "";
      this.form.mensaje = "";
    }
  },

  mounted() {
    const yearSpan = document.getElementById("year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    this.loadProducts();
  }
}).mount("#app");
