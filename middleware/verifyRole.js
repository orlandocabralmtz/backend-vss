const jwt = require('jsonwebtoken');

const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No se proporciona token' });
    }

    try {
      const decoded = jwt.verify(token, 'mi_clave_secreta');
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Acción no permitida para este rol' });
      }
      req.user = decoded; // Almacenamos el usuario decodificado en la request
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Token no válido' });
    }
  };
};

module.exports = verifyRole;
