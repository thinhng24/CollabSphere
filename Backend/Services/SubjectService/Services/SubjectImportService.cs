using OfficeOpenXml;
using SubjectService.Models;
using SubjectService.Data;

namespace SubjectService.Services
{
    public class SubjectImportService
    {
        private readonly SubjectDbContext _context;

        // Inject DbContext để có thể lưu dữ liệu vào DB
        public SubjectImportService(SubjectDbContext context)
        {
            _context = context;
        }

        public async Task<List<Subject>> ImportSubjectsFromExcel(Stream fileStream)
        {
            // Fix cảnh báo bản quyền EPPlus 8+
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            var subjectsList = new List<Subject>();

            using var package = new ExcelPackage(fileStream);
            var worksheet = package.Workbook.Worksheets[0];
            int rowCount = worksheet.Dimension.Rows;

            for (int row = 2; row <= rowCount; row++)
            {
                var subject = new Subject
                {
                    Code = worksheet.Cells[row, 1].Text,
                    Name = worksheet.Cells[row, 2].Text,
                    Description = worksheet.Cells[row, 3].Text
                };
                subjectsList.Add(subject);
            }

            if (subjectsList.Count > 0)
            {
                // Lưu toàn bộ danh sách vào Database
                _context.Subjects.AddRange(subjectsList);
                await _context.SaveChangesAsync();
            }

            return subjectsList;
        }
    }
}