module CityHelpers
  def city_lines(city, params)
    param_lines = if params[:lines]
                    params[:lines].split(',')
                  end

    lines = {}
    city.lines.each { |line|
      lines[line.name] = {show: param_lines && !param_lines.include?(line.url_name) ? false : true,
                          url_name: line.url_name,
                          style: line.style}
    }
    lines
  end

  def city_plans(city, params)
    param_plan_lines = params[:plans] ? params[:plans].split(',') : []

    plans = {}

    city.plans
    .sort_by{ |plan| plan.extra["year"].to_i }
    .each { |plan|
      lines = plan.plan_lines.map {|line|
        {show: param_plan_lines.include?(line.parent_url_name),
         parent_url_name: line.parent_url_name,
         name: line.name,
         style: line.style}
      }
      plans[plan.name]= {
        lines: lines,
        year: plan.extra["year"],
        url: plan.extra["url"]
      }
    }
    plans
  end
end
