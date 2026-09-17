/* =========================================================
   ZAPATERÍA
   Control de productos y ventas
========================================================= */


/* =========================================================
   VARIABLES GENERALES
========================================================= */

/*
   Uso una clave nueva (v3) para que no tome
   datos viejos de las pruebas anteriores.
*/

const CLAVE_PRODUCTOS = "zapateria_productos_v3";
const CLAVE_VENTAS = "zapateria_ventas_v3";

let productos = [];
let ventas = [];


/* =========================================================
   FUNCIONES GENERALES
========================================================= */

function normalizar(texto) {

    return String(texto || "")
        .replace(/^\uFEFF/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}


/*
   Convierte un número a moneda mexicana.
   Ejemplo:

   1799  ->  $1,799.00
*/

function dinero(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "es-MX",
            {
                style: "currency",
                currency: "MXN"
            }
        );
}


/* =========================================================
   IMÁGENES SEGÚN CATEGORÍA
========================================================= */

function imagenCategoria(categoria) {

    const valor = normalizar(categoria);


    /*
        foto1 = Tenis
        foto2 = Casual
        foto3 = Zapato
        foto4 = Bota
        foto5 = Tacón
    */


    if (valor.includes("tenis")) {

        return "imagenes/foto1.png";
    }


    if (valor.includes("casual")) {

        return "imagenes/foto2.png";
    }


    if (valor.includes("zapato")) {

        return "imagenes/foto3.png";
    }


    if (valor.includes("bota")) {

        return "imagenes/foto4.png";
    }


    /*
       Uso "tac" para que siga funcionando
       aunque haya algún problema con el acento.
    */

    if (valor.startsWith("tac")) {

        return "imagenes/foto5.png";
    }


    /*
       Imagen por defecto.
    */

    return "imagenes/foto1.png";
}


/* =========================================================
   DETECTAR SEPARADOR DEL CSV
========================================================= */

function detectarSeparador(linea) {

    const numeroComas =
        (linea.match(/,/g) || []).length;


    const numeroPuntoComa =
        (linea.match(/;/g) || []).length;


    /*
       Excel puede guardar CSV usando:

       ,    coma

       o

       ;    punto y coma
    */

    if (numeroPuntoComa > numeroComas) {

        return ";";
    }


    return ",";
}


/* =========================================================
   LEER UNA FILA DEL CSV
========================================================= */

function leerFilaCSV(linea, separador) {

    const columnas = [];

    let textoActual = "";

    let dentroComillas = false;


    for (let i = 0; i < linea.length; i++) {

        const caracter = linea[i];


        /*
           Si encuentra comillas.
        */

        if (caracter === '"') {


            /*
               Dos comillas seguidas significan
               una comilla dentro del texto.
            */

            if (
                dentroComillas &&
                linea[i + 1] === '"'
            ) {

                textoActual += '"';

                i++;

            } else {

                dentroComillas =
                    !dentroComillas;
            }

        }


        /*
           Si encuentra el separador
           y NO está dentro de comillas,
           termina la columna.
        */

        else if (
            caracter === separador &&
            !dentroComillas
        ) {

            columnas.push(
                textoActual.trim()
            );

            textoActual = "";

        }


        /*
           Cualquier otro carácter
           se agrega normalmente.
        */

        else {

            textoActual += caracter;
        }
    }


    /*
       Agregar última columna.
    */

    columnas.push(
        textoActual.trim()
    );


    return columnas;
}


/* =========================================================
   CONVERTIR VALORES NUMÉRICOS
========================================================= */

function convertirNumero(valor) {

    let texto = String(valor || "")
        .replace(/"/g, "")
        .replace(/\$/g, "")
        .trim();


    if (texto === "") {

        return 0;
    }


    /*
       Si llegara un precio así:

       1,799

       elimina la coma:

       1799
    */

    if (
        /^\d{1,3}(,\d{3})+$/.test(texto)
    ) {

        texto =
            texto.replace(/,/g, "");
    }


    const numero =
        Number(texto);


    if (Number.isFinite(numero)) {

        return numero;
    }


    return 0;
}


/* =========================================================
   CONVERTIR CSV A PRODUCTOS
========================================================= */

function convertirCSV(texto) {

    /*
       Eliminar BOM que a veces agrega Excel.
    */

    texto =
        texto.replace(/^\uFEFF/, "");


    /*
       Separar el archivo por líneas.
    */

    const lineas = texto
        .replace(/\r/g, "")
        .split("\n")
        .filter(
            linea =>
                linea.trim() !== ""
        );


    /*
       Si no hay información suficiente.
    */

    if (lineas.length < 2) {

        console.error(
            "El archivo CSV está vacío."
        );

        return [];
    }


    /*
       Detectar si Excel utilizó:
       coma o punto y coma.
    */

    const separador =
        detectarSeparador(
            lineas[0]
        );


    const productosCSV = [];


    /*
       La línea 0 contiene:

       Código
       Marca
       Modelo
       Categoría
       Talla (MX)
       Precio (MXN)
       Existencia (pares)

       Por eso empezamos en 1.
    */

    for (
        let i = 1;
        i < lineas.length;
        i++
    ) {


        const columnas =
            leerFilaCSV(
                lineas[i],
                separador
            );


        /*
           Necesitamos siete columnas.
        */

        if (columnas.length < 7) {

            console.warn(
                "Fila ignorada:",
                lineas[i]
            );

            continue;
        }


        /*
           TU ARCHIVO ESTÁ ORGANIZADO ASÍ:

           0 = Código
           1 = Marca
           2 = Modelo
           3 = Categoría
           4 = Talla (MX)
           5 = Precio (MXN)
           6 = Existencia (pares)
        */


        const producto = {

            codigo:
                columnas[0].trim(),

            marca:
                columnas[1].trim(),

            modelo:
                columnas[2].trim(),

            categoria:
                columnas[3].trim(),

            talla:
                columnas[4].trim(),

            precio:
                convertirNumero(
                    columnas[5]
                ),

            existencia:
                Math.max(
                    0,
                    Math.trunc(
                        convertirNumero(
                            columnas[6]
                        )
                    )
                )
        };


        /*
           Solo guardar filas que tengan código.
        */

        if (producto.codigo !== "") {

            productosCSV.push(
                producto
            );
        }
    }


    console.log(
        "Productos cargados desde CSV:",
        productosCSV
    );


    console.log(
        "Cantidad de productos:",
        productosCSV.length
    );


    return productosCSV;
}


/* =========================================================
   GUARDAR PRODUCTOS
========================================================= */

function guardarProductos() {

    localStorage.setItem(
        CLAVE_PRODUCTOS,
        JSON.stringify(productos)
    );
}


/* =========================================================
   GUARDAR VENTAS
========================================================= */

function guardarVentas() {

    localStorage.setItem(
        CLAVE_VENTAS,
        JSON.stringify(ventas)
    );
}


/* =========================================================
   CARGAR DATOS
========================================================= */

async function cargarDatos() {

    /*
       Primero revisar si ya existen
       productos guardados.
    */

    const productosGuardados =
        localStorage.getItem(
            CLAVE_PRODUCTOS
        );


    if (productosGuardados) {

        try {

            const datos =
                JSON.parse(
                    productosGuardados
                );


            if (
                Array.isArray(datos) &&
                datos.length > 0
            ) {

                productos = datos;
            }

        } catch (error) {

            console.error(
                "Error leyendo productos guardados:",
                error
            );

            productos = [];
        }
    }


    /*
       Si todavía no tenemos productos,
       cargar productos.csv.
    */

    if (productos.length === 0) {

        try {

            /*
               Date.now() evita que Firefox
               utilice una copia vieja del CSV.
            */

            const respuesta =
                await fetch(
                    "productos.csv?v=" +
                    Date.now()
                );


            if (!respuesta.ok) {

                throw new Error(
                    "No se encontró productos.csv"
                );
            }


            const texto =
                await respuesta.text();


            productos =
                convertirCSV(texto);


            if (productos.length === 0) {

                throw new Error(
                    "productos.csv se abrió, pero no se pudieron leer productos."
                );
            }


            guardarProductos();


        } catch (error) {

            console.error(
                "ERROR AL CARGAR CSV:",
                error
            );


            alert(
                "No se pudieron cargar los productos del archivo productos.csv"
            );
        }
    }


    /*
       Cargar ventas guardadas.
    */

    const ventasGuardadas =
        localStorage.getItem(
            CLAVE_VENTAS
        );


    if (ventasGuardadas) {

        try {

            const datosVentas =
                JSON.parse(
                    ventasGuardadas
                );


            if (
                Array.isArray(
                    datosVentas
                )
            ) {

                ventas =
                    datosVentas;
            }

        } catch {

            ventas = [];
        }
    }


    /*
       Al iniciar:

       buscador vacío
       todas las categorías.
    */

    document.getElementById(
        "buscarProducto"
    ).value = "";


    document.getElementById(
        "filtroCategoria"
    ).value = "";


    actualizarTodo();
}


/* =========================================================
   RESUMEN SUPERIOR
========================================================= */

function actualizarResumen() {

    /*
       Número de productos.
    */

    document.getElementById(
        "totalProductos"
    ).textContent =
        productos.length;


    /*
       Sumar todos los pares.
    */

    const pares =
        productos.reduce(
            function(total, producto) {

                return total +
                    Number(
                        producto.existencia
                    );

            },
            0
        );


    document.getElementById(
        "totalExistencias"
    ).textContent =
        pares;


    /*
       Número de ventas.
    */

    document.getElementById(
        "totalVentas"
    ).textContent =
        ventas.length;
}


/* =========================================================
   MOSTRAR INVENTARIO
========================================================= */

function mostrarInventario() {

    const tabla =
        document.getElementById(
            "tablaInventario"
        );


    const busqueda =
        normalizar(
            document.getElementById(
                "buscarProducto"
            ).value
        );


    const categoria =
        normalizar(
            document.getElementById(
                "filtroCategoria"
            ).value
        );


    tabla.innerHTML = "";


    /*
       Filtrar productos.
    */

    const filtrados =
        productos.filter(
            function(producto) {


                const textoProducto =
                    normalizar(

                        producto.codigo +
                        " " +
                        producto.marca +
                        " " +
                        producto.modelo

                    );


                const coincideBusqueda =
                    textoProducto.includes(
                        busqueda
                    );


                const coincideCategoria =

                    categoria === ""

                    ||

                    normalizar(
                        producto.categoria
                    ) === categoria;


                return (
                    coincideBusqueda &&
                    coincideCategoria
                );
            }
        );


    /*
       Si no encontró productos.
    */

    if (filtrados.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="7">
                    No se encontraron productos.
                </td>

            </tr>

        `;

        return;
    }


    /*
       Crear cada fila.
    */

    filtrados.forEach(
        function(producto) {


            const fila =
                document.createElement(
                    "tr"
                );


            /*
               Color de existencia.
            */

            let claseStock =
                "stock-normal";


            if (
                Number(
                    producto.existencia
                ) === 0
            ) {

                claseStock =
                    "sin-stock";

            }

            else if (
                Number(
                    producto.existencia
                ) <= 2
            ) {

                claseStock =
                    "stock-bajo";
            }


            /*
               Crear contenido.
            */

            fila.innerHTML = `

                <td>

                    <img
                        class="miniatura"
                        src="${imagenCategoria(producto.categoria)}"
                        alt="${producto.categoria}"
                    >

                </td>


                <td>
                    ${producto.codigo}
                </td>


                <td>

                    <strong>
                        ${producto.marca}
                    </strong>

                    <br>

                    ${producto.modelo}

                </td>


                <td>
                    ${producto.categoria}
                </td>


                <td>
                    ${producto.talla}
                </td>


                <td>
                    ${dinero(producto.precio)}
                </td>


                <td class="${claseStock}">
                    ${producto.existencia}
                </td>

            `;


            tabla.appendChild(
                fila
            );
        }
    );
}


/* =========================================================
   PRODUCTOS DISPONIBLES PARA VENTA
========================================================= */

function cargarProductosDisponibles() {

    const select =
        document.getElementById(
            "productoVenta"
        );


    /*
       Guardar producto seleccionado.
    */

    const anterior =
        select.value;


    /*
       Limpiar selector.
    */

    select.innerHTML = `

        <option value="">
            Seleccione un producto
        </option>

    `;


    /*
       Mostrar solamente productos
       con existencia mayor a cero.
    */

    productos
        .filter(
            function(producto) {

                return Number(
                    producto.existencia
                ) > 0;
            }
        )
        .forEach(
            function(producto) {


                const opcion =
                    document.createElement(
                        "option"
                    );


                opcion.value =
                    producto.codigo;


                opcion.textContent =

                    producto.codigo
                    +
                    " - "
                    +
                    producto.marca
                    +
                    " "
                    +
                    producto.modelo
                    +
                    " - Talla "
                    +
                    producto.talla
                    +
                    " - Stock "
                    +
                    producto.existencia;


                select.appendChild(
                    opcion
                );
            }
        );


    /*
       Mantener selección si sigue disponible.
    */

    const sigueDisponible =
        productos.some(
            function(producto) {

                return (
                    producto.codigo === anterior
                    &&
                    producto.existencia > 0
                );
            }
        );


    if (sigueDisponible) {

        select.value =
            anterior;
    }


    actualizarInformacionVenta();
}


/* =========================================================
   MOSTRAR INFORMACIÓN DE LA VENTA
========================================================= */

function actualizarInformacionVenta() {

    const codigo =
        document.getElementById(
            "productoVenta"
        ).value;


    const cantidad =
        Number(
            document.getElementById(
                "cantidadVenta"
            ).value
        ) || 1;


    const producto =
        productos.find(
            function(producto) {

                return (
                    producto.codigo ===
                    codigo
                );
            }
        );


    const informacion =
        document.getElementById(
            "informacionVenta"
        );


    /*
       Si no hay producto seleccionado.
    */

    if (!producto) {

        informacion.textContent =
            "Seleccione un producto para consultar sus datos.";

        return;
    }


    /*
       Mostrar información.
    */

    informacion.innerHTML = `

        <strong>
            ${producto.marca}
            ${producto.modelo}
        </strong>

        <br>

        Código:
        ${producto.codigo}

        <br>

        Categoría:
        ${producto.categoria}

        <br>

        Talla:
        ${producto.talla}

        <br>

        Existencia actual:
        ${producto.existencia}

        <br>

        Precio unitario:
        ${dinero(producto.precio)}

        <br>

        Total:

        <strong>

            ${dinero(
                producto.precio *
                cantidad
            )}

        </strong>

    `;
}


/* =========================================================
   REGISTRAR NUEVO PRODUCTO
========================================================= */

document
    .getElementById(
        "formProducto"
    )
    .addEventListener(
        "submit",
        function(evento) {


            evento.preventDefault();


            const mensaje =
                document.getElementById(
                    "mensajeProducto"
                );


            const codigo =
                document
                    .getElementById(
                        "codigo"
                    )
                    .value
                    .trim();


            /*
               Verificar código repetido.
            */

            const existe =
                productos.some(
                    function(producto) {

                        return (

                            normalizar(
                                producto.codigo
                            )

                            ===

                            normalizar(
                                codigo
                            )

                        );
                    }
                );


            if (existe) {

                mensaje.textContent =
                    "El código ya está registrado.";

                mensaje.style.color =
                    "#a33434";

                return;
            }


            /*
               Crear producto.
            */

            const nuevoProducto = {

                codigo:
                    codigo,


                marca:
                    document
                        .getElementById(
                            "marca"
                        )
                        .value
                        .trim(),


                modelo:
                    document
                        .getElementById(
                            "modelo"
                        )
                        .value
                        .trim(),


                categoria:
                    document
                        .getElementById(
                            "categoria"
                        )
                        .value,


                talla:
                    document
                        .getElementById(
                            "talla"
                        )
                        .value,


                precio:
                    Number(
                        document
                            .getElementById(
                                "precio"
                            )
                            .value
                    ),


                existencia:
                    Number(
                        document
                            .getElementById(
                                "existencia"
                            )
                            .value
                    )
            };


            /*
               Agregar al arreglo.
            */

            productos.push(
                nuevoProducto
            );


            /*
               Guardar.
            */

            guardarProductos();


            /*
               Actualizar pantalla.
            */

            actualizarTodo();


            /*
               Limpiar formulario.
            */

            this.reset();


            mensaje.textContent =
                "Producto registrado correctamente.";


            mensaje.style.color =
                "#31713b";
        }
    );


/* =========================================================
   REGISTRAR VENTA
========================================================= */

document
    .getElementById(
        "formVenta"
    )
    .addEventListener(
        "submit",
        function(evento) {


            evento.preventDefault();


            const mensaje =
                document.getElementById(
                    "mensajeVenta"
                );


            const codigo =
                document
                    .getElementById(
                        "productoVenta"
                    )
                    .value;


            const cantidad =
                Number(
                    document
                        .getElementById(
                            "cantidadVenta"
                        )
                        .value
                );


            /*
               Buscar producto.
            */

            const producto =
                productos.find(
                    function(producto) {

                        return (
                            producto.codigo ===
                            codigo
                        );
                    }
                );


            /*
               Validar selección.
            */

            if (!producto) {

                mensaje.textContent =
                    "Seleccione un producto.";

                mensaje.style.color =
                    "#a33434";

                return;
            }


            /*
               Validar cantidad.
            */

            if (
                !Number.isInteger(
                    cantidad
                )
                ||
                cantidad <= 0
            ) {

                mensaje.textContent =
                    "Ingrese una cantidad válida.";

                mensaje.style.color =
                    "#a33434";

                return;
            }


            /*
               Validar existencia.
            */

            if (
                cantidad >
                producto.existencia
            ) {

                mensaje.textContent =
                    "No hay suficientes pares disponibles.";

                mensaje.style.color =
                    "#a33434";

                return;
            }


            /*
               DESCONTAR EXISTENCIA.
            */

            producto.existencia -=
                cantidad;


            /*
               CREAR REGISTRO DE VENTA.
            */

            const venta = {

                folio:
                    "V"
                    +
                    String(
                        ventas.length + 1
                    ).padStart(
                        3,
                        "0"
                    ),


                fecha:
                    new Date()
                        .toLocaleString(
                            "es-MX"
                        ),


                producto:
                    producto.marca
                    +
                    " "
                    +
                    producto.modelo,


                talla:
                    producto.talla,


                cantidad:
                    cantidad,


                total:
                    producto.precio
                    *
                    cantidad
            };


            /*
               Agregar venta al inicio.
            */

            ventas.unshift(
                venta
            );


            /*
               Guardar cambios.
            */

            guardarProductos();

            guardarVentas();


            /*
               Actualizar interfaz.
            */

            actualizarTodo();


            /*
               Regresar cantidad a 1.
            */

            document
                .getElementById(
                    "cantidadVenta"
                )
                .value = 1;


            mensaje.textContent =
                "Venta registrada correctamente. La existencia fue actualizada.";


            mensaje.style.color =
                "#31713b";
        }
    );


/* =========================================================
   MOSTRAR VENTAS
========================================================= */

function mostrarVentas() {

    const tabla =
        document.getElementById(
            "tablaVentas"
        );


    tabla.innerHTML = "";


    /*
       Sin ventas.
    */

    if (ventas.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="6">

                    No hay ventas registradas.

                </td>

            </tr>

        `;

        return;
    }


    /*
       Mostrar historial.
    */

    ventas.forEach(
        function(venta) {


            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `

                <td>
                    ${venta.folio}
                </td>

                <td>
                    ${venta.fecha}
                </td>

                <td>
                    ${venta.producto}
                </td>

                <td>
                    ${venta.talla}
                </td>

                <td>
                    ${venta.cantidad}
                </td>

                <td>
                    ${dinero(
                        venta.total
                    )}
                </td>

            `;


            tabla.appendChild(
                fila
            );
        }
    );
}


/* =========================================================
   CAMBIAR ENTRE SECCIONES
========================================================= */

document
    .querySelectorAll(
        ".menu-boton"
    )
    .forEach(
        function(boton) {


            boton.addEventListener(
                "click",
                function() {


                    /*
                       Quitar selección de botones.
                    */

                    document
                        .querySelectorAll(
                            ".menu-boton"
                        )
                        .forEach(
                            function(elemento) {

                                elemento
                                    .classList
                                    .remove(
                                        "activo"
                                    );
                            }
                        );


                    /*
                       Ocultar paneles.
                    */

                    document
                        .querySelectorAll(
                            ".panel"
                        )
                        .forEach(
                            function(panel) {

                                panel
                                    .classList
                                    .remove(
                                        "activo"
                                    );
                            }
                        );


                    /*
                       Activar botón.
                    */

                    this.classList.add(
                        "activo"
                    );


                    /*
                       Mostrar panel.
                    */

                    document
                        .getElementById(
                            this.dataset.panel
                        )
                        .classList.add(
                            "activo"
                        );
                }
            );
        }
    );


/* =========================================================
   BUSCADOR
========================================================= */

document
    .getElementById(
        "buscarProducto"
    )
    .addEventListener(
        "input",
        mostrarInventario
    );


/* =========================================================
   FILTRO DE CATEGORÍA
========================================================= */

document
    .getElementById(
        "filtroCategoria"
    )
    .addEventListener(
        "change",
        mostrarInventario
    );


/* =========================================================
   SELECT DE VENTA
========================================================= */

document
    .getElementById(
        "productoVenta"
    )
    .addEventListener(
        "change",
        actualizarInformacionVenta
    );


/* =========================================================
   CANTIDAD DE VENTA
========================================================= */

document
    .getElementById(
        "cantidadVenta"
    )
    .addEventListener(
        "input",
        actualizarInformacionVenta
    );


/* =========================================================
   RECARGAR DATOS DESDE CSV
========================================================= */

document
    .getElementById(
        "restablecer"
    )
    .addEventListener(
        "click",
        function() {


            const confirmar =
                confirm(
                    "Se eliminarán los cambios realizados y se volverán a cargar los productos del archivo productos.csv. También se eliminarán las ventas registradas. ¿Desea continuar?"
                );


            if (!confirmar) {

                return;
            }


            /*
               Borrar productos guardados.
            */

            localStorage.removeItem(
                CLAVE_PRODUCTOS
            );


            /*
               Borrar ventas guardadas.
            */

            localStorage.removeItem(
                CLAVE_VENTAS
            );


            /*
               Recargar página.
            */

            location.reload();
        }
    );


/* =========================================================
   ACTUALIZAR TODA LA PÁGINA
========================================================= */

function actualizarTodo() {

    actualizarResumen();

    mostrarInventario();

    cargarProductosDisponibles();

    mostrarVentas();
}


/* =========================================================
   INICIAR SISTEMA
========================================================= */

cargarDatos();