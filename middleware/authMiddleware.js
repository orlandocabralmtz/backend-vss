const jwt = require('jsonwebtoken');

const protect = (roles = []) => {
  return (req, res, next) => {
    // Obtener el token desde el encabezado Authorization
    let token = req.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'No se proporcionó un token' });
    }

    token = token.split(' ')[1]; // Eliminar "Bearer " y obtener solo el token

    try {
      console.log('Token recibido:', token); // Verificar el token recibido

      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificar el token
      console.log('Token decodificado:', decoded); // Verificar el contenido del token

      req.user = decoded; // Guardar la información del usuario en la solicitud

      // Si no se proporcionan roles, permite el acceso a todos
      if (roles.length && !roles.includes(req.user.rol)) {
        return res.status(403).json({ mensaje: 'No tienes permisos para acceder a esta ruta' });
      }

      next(); // Continuar al siguiente middleware o controlador
    } catch (error) {
      console.error('Error al verificar el token:', error);

      // Manejar error de token malformado
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ mensaje: 'Token malformado o inválido' });
      }

      // Manejar otros tipos de error relacionados con el token (como expirado)
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ mensaje: 'Token expirado' });
      }

      // Error genérico de token inválido
      return res.status(401).json({ mensaje: 'Token inválido o expirado', error: error.message });
    }
  };
};

module.exports = protect;
