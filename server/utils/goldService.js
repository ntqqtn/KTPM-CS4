const db = require('../db/dbConnect');//
const {Data} = require('../db/dbConnect');
const {sequelize} = require('../db/dbConnect');
const { Op} = require('sequelize');
const { publishGoldPrice } = require('../services/pubsub/publisher');

async function saveGoldPrice({ gold_type, sell_price, buy_price, updated_at }) {//
  try {
    // Kiểm tra dữ liệu
    if (!gold_type || typeof sell_price !== 'number' || typeof buy_price !== 'number' || !updated_at) {
      throw new Error('Dữ liệu không hợp lệ');
    }

    // Thêm hoặc cập nhật dữ liệu
    await Data.upsert({
      gold_type,
      sell_price,
      buy_price,
      updated_at: new Date(updated_at)
    });

    // Gọi hàm xử lý tiếp sau khi lưu thành công
    // await publishGoldPrice({ gold_type, sell_price, buy_price, updated_at });
  } catch (err) {
    throw new Error('Lỗi khi lưu dữ liệu vàng: ' + err.message);
  }
}

async function viewLatestGoldPrice() {
  try {
    const records = await Data.findAll({
        attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
        where: sequelize.literal(`(gold_type, updated_at) IN (
            SELECT gold_type, MAX(updated_at)
            FROM data
            GROUP BY gold_type
        )`),
        order: [['gold_type', 'ASC']],
        raw: true
    });
    return records;
  } catch (err) {
      throw new Error(err.message);
  }
}
// Hàm thêm hoặc cập nhật dữ liệu
async function write(gold_type, sell_price, buy_price, updated_at) {//
  try {
      if (!gold_type || typeof sell_price !== 'number' || typeof buy_price !== 'number' || !updated_at) {
          throw new Error('Dữ liệu không hợp lệ');
      }

      const [record, created] = await Data.upsert({
          gold_type,
          sell_price,
          buy_price,
          updated_at: new Date(updated_at)
      }, {
          conflictFields: ['gold_type', 'updated_at']
      });

      return created ? record.id : record.id;
  } catch (err) {
      throw new Error(err.message);
  }
}

// Hàm cập nhật nhiều bản ghi
async function updateGoldPrices(dataArray) {
  try {
      const promises = dataArray.map(item => {
          if (!item.gold_type || typeof item.sell_price !== 'number' || typeof item.buy_price !== 'number' || !item.updated_at) {
              throw new Error('Dữ liệu không hợp lệ.');
          }
          return Data.upsert({
              gold_type: item.gold_type,
              sell_price: item.sell_price,
              buy_price: item.buy_price,
              updated_at: new Date(item.updated_at)
          }, {
              conflictFields: ['gold_type', 'updated_at']
          });
      });

      await Promise.all(promises);
      return `Đã cập nhật ${dataArray.length} dòng`;
  } catch (err) {
      throw new Error(err.message);
  }
}

// Hàm lấy dữ liệu mới nhất của mỗi loại vàng
async function view_latest_price() {
  try {
      const records = await Data.findAll({
          attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
          where: sequelize.literal(`(gold_type, updated_at) IN (
              SELECT gold_type, MAX(updated_at)
              FROM data
              GROUP BY gold_type
          )`),
          order: [['gold_type', 'ASC']],
          raw: true
      });
      return records;
  } catch (err) {
      throw new Error(err.message);
  }
}

// Hàm lấy dữ liệu mới nhất của mỗi loại vàng trong một ngày cụ thể
// async function view_by_date(date) {
//   try {
//     console.log("đã vào view_by_date");
//       const formattedDate = new Date(date).toISOString().split('T')[0];
//       console.log("date đã sửa để hợp db", formattedDate);
//       const records = await Data.findAll({
//           attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
//           where: sequelize.literal(`(gold_type, updated_at) IN (
//               SELECT gold_type, MAX(updated_at)
//               FROM data
//               WHERE DATE(updated_at) = '${formattedDate}'
//               GROUP BY gold_type
//           )`),
//           order: [['gold_type', 'ASC']],
//           raw: true
//       });
//       console.log("records trong view_by_date", records);
//       return records;
//   } catch (err) {
//       throw new Error(err.message);
//   }
// }
async function view_by_date(date) {
    try {
      console.log("đã vào view_by_date");
  
      // Chuyển date đầu vào thành khoảng thời gian UTC tương ứng với ngày đó ở VN (UTC+7)
      const startVN = new Date(date); // Lấy ngày đầu vào (ví dụ: 2025-04-20)
      startVN.setUTCHours(-7, 0, 0, 0); // 00:00 VN => 17:00 UTC (của ngày hôm trước)
      
      const endVN = new Date(date); // Tương tự, nhưng cho thời gian kết thúc (23:59:59)
      endVN.setUTCHours(16, 59, 59, 999); // 23:59:59 VN => 16:59:59 UTC
  
      console.log("Khoảng thời gian UTC:", startVN.toISOString(), '->', endVN.toISOString());
  
      // Bước 1: Tìm bản ghi có thời gian cập nhật lớn nhất cho từng loại vàng trong khoảng thời gian ngày đó (tính theo UTC)
      const records = await Data.findAll({
        attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
        where: {
          updated_at: {
            [Op.between]: [startVN, endVN], // Lọc dữ liệu trong khoảng thời gian ngày VN
          }
        },
        group: ['gold_type'], // Nhóm theo gold_type
        order: [['gold_type', 'ASC']], // Sắp xếp theo gold_type tăng dần
        subQuery: false, // Để Sequelize không tạo subquery
        raw: true
      });
  
      // Kiểm tra xem có bản ghi nào không
      if (records.length === 0) {
        console.log("Không tìm thấy dữ liệu cho ngày này.");
        return []; // Nếu không có dữ liệu, trả về mảng rỗng
      }
  
      // Dữ liệu trả về sẽ là một mảng các bản ghi với giá vàng mới nhất cho từng loại vàng trong ngày
      console.log("Dữ liệu mới nhất trong ngày:", records);
      return records; // Trả về tất cả bản ghi
  
    } catch (err) {
      console.error("Lỗi trong view_by_date:", err);
      throw new Error(err.message);
    }
  }
// Hàm lấy dữ liệu mới nhất của mỗi loại vàng trong ngày hôm qua
async function view_yesterday_price() {
  try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formattedDate = yesterday.toISOString().split('T')[0];
      const records = await Data.findAll({
          attributes: ['gold_type', 'sell_price', 'buy_price', 'updated_at'],
          where: sequelize.literal(`(gold_type, updated_at) IN (
              SELECT gold_type, MAX(updated_at)
              FROM data
              WHERE DATE(updated_at) = '${formattedDate}'
              GROUP BY gold_type
          )`),
          order: [['gold_type', 'ASC']],
          raw: true
      });
      return records;
  } catch (err) {
      throw new Error(err.message);
  }
}

// Hàm lấy tất cả dữ liệu
async function viewAll() {
  try {
      const records = await Data.findAll({
          order: [['updated_at', 'DESC']],
          raw: true
      });
      return records;
  } catch (err) {
      throw new Error(err.message);
  }
}

// Hàm lấy danh sách tất cả các loại vàng duy nhất
async function get_all_gold_types() {
  try {
      const records = await Data.findAll({
          attributes: [[sequelize.fn('DISTINCT', sequelize.col('gold_type')), 'gold_type']],
          raw: true
      });
      return records.map(record => record.gold_type);
  } catch (err) {
      throw new Error(err.message);
  }
}

// Hàm xóa tất cả bản ghi theo gold_type
async function deleteByGoldType(gold_type) {
  try {
      if (!gold_type) {
          throw new Error('gold_type không hợp lệ');
      }
      const deletedCount = await Data.destroy({
          where: { gold_type }
      });
      return deletedCount;
  } catch (err) {
      throw new Error(err.message);
  }
}

module.exports = {
  write,
  updateGoldPrices,
  view_latest_price,
  view_by_date,
  view_yesterday_price,
  viewAll,
  get_all_gold_types,
  deleteByGoldType,
  saveGoldPrice, viewLatestGoldPrice
};
// module.exports = { saveGoldPrice, viewLatestGoldPrice };