module.exports = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach((el) => {
        // if the current fields is one of the allowed fields
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};
