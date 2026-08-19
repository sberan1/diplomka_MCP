import { Tool } from '@rekog/mcp-nest';
import { Injectable } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class GetAllCoursesTool {
  constructor(private readonly coursesService: CoursesService) {}

  @Tool({
    name: 'Get all courses',
    description: 'Returns all courses from the database',
  })
  getAllCourses() {
    return this.coursesService.getAllCourses();
  }
}
