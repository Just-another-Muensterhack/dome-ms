from django.db import migrations


def name_existing_contents(apps, schema_editor):
    WebsiteContent = apps.get_model('website', 'WebsiteContent')
    for content in WebsiteContent.objects.order_by('created_at'):
        content.name = 'Snapshot'
        content.save(update_fields=['name'])


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0005_content_upload'),
    ]

    operations = [
        migrations.RunPython(name_existing_contents, migrations.RunPython.noop),
    ]
