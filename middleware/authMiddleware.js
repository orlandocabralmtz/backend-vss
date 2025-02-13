const jwt = require('jsonwebtoken');

const protect = (roles = []) => {
    return (req, res, next) => {
        // Obtener el token desde el encabezado Authorization
        let token = req.headers.authorization;

        // Loguear el token recibido para asegurar que el cliente lo esté enviando
        console.log('Token recibido desde el cliente:', token);

        // Comprobar si el token existe y tiene el formato correcto
        if (!token || !token.startsWith('Bearer ')) {
            console.log('No se proporcionó un token o el formato es incorrecto');
            return res.status(401).json({ mensaje: 'No se proporcionó un token o formato incorrecto' });
        }

        token = token.split(' ')[1]; // Eliminar "Bearer " y obtener solo el token

        // Verificar si el token es null o vacío después de procesarlo
        if (!token || token === 'null') {
            console.log('Token vacío o malformado');
            return res.status(401).json({ mensaje: 'No se proporcionó un token' });
        }

        console.log('Token procesado:', token); // Verificar el token procesado

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificar el token
            console.log('Token decodificado:', decoded); // Verificar el contenido del token

            req.user = decoded; // Guardar la información del usuario en la solicitud

            // Si no se proporcionan roles, permite el acceso a todos
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ mensaje: 'No tienes permisos para acceder a esta ruta' });
            }

            next(); // Continuar al siguiente middleware o controlador
        } catch (error) {
            console.error('Error al verificar el token:', error);

            // Manejar diferentes errores de JWT
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ mensaje: 'Token malformado o inválido' });
            }

            if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json({ mensaje: 'Token expirado' });
            }

            return res.status(401).json({ mensaje: 'Token inválido', error: error.message });
        }
    };
};

module.exports = protect;
