using OfficeOpenXml;
using CollabSphere.File.API.Models;

namespace CollabSphere.File.API.Services
{
    public class SubjectImportService
    {
        public List<SubjectImportDto> ImportSubjectsFromExcel(Stream fileStream)
        {
            // ✅ BẮT BUỘC: khai báo license
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            var subjects = new List<SubjectImportDto>();

            using var package = new ExcelPackage(fileStream);
            var worksheet = package.Workbook.Worksheets[0];

            int rowCount = worksheet.Dimension.Rows;

            for (int row = 2; row <= rowCount; row++)
            {
                subjects.Add(new SubjectImportDto
                {
                    Code = worksheet.Cells[row, 1].Text,
                    Name = worksheet.Cells[row, 2].Text,
                    Description = worksheet.Cells[row, 3].Text
                });
            }

            return subjects;
        }
    }
}
